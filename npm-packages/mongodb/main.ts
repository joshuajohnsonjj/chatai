import { MongoClient } from 'mongodb';
import {
    type DataElementInsertSummary,
    IndexName,
    type DataElementQueryInput,
    type DataElementVectorInput,
    type MongoAnnotationLabelCollectionDoc,
    type MongoAuthorCollectionDoc,
    type MongoDataElementCollectionDoc,
    type QueryFilter,
    type VectorQueryFilter,
} from './types';

/**
 * ## Wrapper for mongo db client
 *
 * **NOTE:** Need to call the init() method to
 * open connection
 */
export class MongoDBService {
    private client: MongoClient;

    private readonly dbName: string;

    private static readonly elementCollection = 'data_element';

    private static readonly authorCollection = 'author';

    private static readonly labelCollection = 'label';

    constructor(connString: string, dbName: string) {
        this.client = new MongoClient(connString);
        this.dbName = dbName;
    }

    /**
     * Must call this before using
     */
    public async init() {
        this.client = await this.client.connect();
    }

    public async terminate() {
        await this.client.close();
    }

    /**
     * Retrieves data element by element id. Verified owner entity id always required for
     * any query for security.
     */
    public async getDataElementById(
        id: string,
        ownerEntityId: string,
    ): Promise<Omit<MongoDataElementCollectionDoc, 'embedding'> | null> {
        return await this.elementCollConnection.findOne({ _id: id, ownerEntityId }, { projection: { embedding: 0 } });
    }

    public async queryDataElements(
        query: DataElementQueryInput,
        skip = 0,
        limit = 50,
    ): Promise<{
        numResults: number;
        nextStartNdx: number;
        results: Omit<MongoDataElementCollectionDoc, 'embedding'>[];
    }> {
        const filters: QueryFilter = {
            ownerEntityId: query.entityId,
        };

        if (query.authorFilters && query.authorFilters.length) {
            filters.authorName = { $in: query.authorFilters };
        }
        if (query.sourceTypeFilters && query.sourceTypeFilters.length) {
            filters.dataSourceType = { $in: query.sourceTypeFilters };
        }
        if (query.topics && query.topics.length) {
            filters.annotations = { $all: query.topics };
        }
        if (query.dateRangeLower || query.dateRangeUpper) {
            filters.createdAt = {};
            if (query.dateRangeLower) {
                filters.createdAt['$gte'] = query.dateRangeLower;
            }
            if (query.dateRangeUpper) {
                filters.createdAt['$lte'] = query.dateRangeUpper;
            }
        }

        const cursor = this.elementCollConnection.find(filters).limit(limit).skip(skip).project({ embedding: 0 });

        const [numResults, results] = await Promise.all([
            this.elementCollConnection.countDocuments(filters),
            cursor.toArray(),
        ]);

        return {
            numResults,
            nextStartNdx: skip + limit + 1,
            results: results as Omit<MongoDataElementCollectionDoc, 'embedding'>[],
        };
    }

    /**
     * Required that vector queries are filtered by owner entity id. Optionally
     * further filter by author name and/or data source type name.
     *
     * To achieve optimal performance (accuracy + latency) using 10-20 x limit
     * for numCandidates is recommended
     * https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/
     */
    public async queryDataElementsByVector(
        query: DataElementVectorInput,
        limit = 3,
    ): Promise<(MongoDataElementCollectionDoc & { score: number })[]> {
        const filter: VectorQueryFilter = {
            $and: [
                {
                    ownerEntityId: {
                        $eq: query.entityId,
                    },
                },
            ],
        };

        if (query.sourceTypeFilters && query.sourceTypeFilters.length) {
            filter['$and']!.push({
                dataSourceType: {
                    $in: query.sourceTypeFilters,
                },
            });
        }

        if (query.authorFilters && query.authorFilters.length) {
            filter['$and']!.push({
                authorName: {
                    $in: query.authorFilters,
                },
            });
        }

        if (query.dateRangeLower || query.dateRangeUpper) {
            filter['$and']!.createdAt = {};
            if (query.dateRangeLower) {
                filter['$and']!.createdAt['$gte'] = query.dateRangeLower;
            }
            if (query.dateRangeUpper) {
                filter['$and']!.createdAt['$lte'] = query.dateRangeUpper;
            }
        }

        const pipeline = [
            {
                $vectorSearch: {
                    index: IndexName.VECTOR,
                    path: 'embedding',
                    filter,
                    queryVector: query.vectorizedQuery,
                    numCandidates: limit * 20,
                    limit,
                },
            },
            {
                $project: {
                    embedding: 0,
                    score: { $meta: 'vectorSearchScore' },
                },
            },
        ];

        const result = await this.elementCollConnection.aggregate(pipeline).toArray();

        if (!query.topics) {
            return result as (MongoDataElementCollectionDoc & { score: number })[];
        }

        // Since Mongo doesn't support partial array query in filter w/ vector search
        // do this here. Perhaps eventually they'll add native support for this.
        return result.filter((element) =>
            element.annotations.some((annotation: string) => query.topics!.includes(annotation)),
        ) as (MongoDataElementCollectionDoc & { score: number })[];
    }

    /**
     * Performs an upsert operation based on the _id property
     *
     * @returns
     * An insert summary containing text length and an indication of whether
     * document was inserted or updated.
     *
     * isNew: true if inserted, false if updated
     *
     * lengthDiff: the diff in saved data element text length. If inserting
     * new document returns text length of new document.
     */
    public async writeDataElements(data: MongoDataElementCollectionDoc): Promise<DataElementInsertSummary> {
        const originalDoc = await this.getDataElementById(data._id, data.ownerEntityId);
        await this.elementCollConnection.replaceOne({ _id: data._id }, data, { upsert: true });

        if (originalDoc) {
            return {
                lengthDiff: data.text.length - originalDoc.text!.length,
                isNew: false,
            };
        }

        return {
            lengthDiff: data.text.length,
            isNew: false,
        };
    }

    /**
     * Performs an upsert operation based on combination of org id and author name
     */
    public async writeAuthors(data: Omit<MongoAuthorCollectionDoc, '_id'>): Promise<void> {
        await this.authorCollConnection.replaceOne({ entityId: data.entityId, name: data.name }, data, {
            upsert: true,
        });
    }

    public async searchAuthorOptions(
        name: string,
        entityId: string,
        limit = 5,
    ): Promise<(Pick<MongoAuthorCollectionDoc, '_id' | 'name' | 'email'> & { score: number })[]> {
        const pipeline = [
            {
                $search: {
                    index: IndexName.AUTHOR_SEARCH,
                    compound: {
                        must: [
                            {
                                text: {
                                    query: entityId,
                                    path: 'entityId',
                                },
                            },
                        ],
                        should: [
                            {
                                autocomplete: {
                                    query: name,
                                    path: 'name',
                                    fuzzy: {
                                        maxEdits: 1,
                                        prefixLength: 1,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            { $limit: limit },
            {
                $project: {
                    name: 1,
                    email: 1,
                    score: { $meta: 'searchScore' },
                },
            },
        ];

        const cursor = this.authorCollConnection.aggregate(pipeline);
        return (await cursor.toArray()) as (Pick<MongoAuthorCollectionDoc, '_id' | 'name' | 'email'> & {
            score: number;
        })[];
    }

    /**
     * Performs an upsert operation based on combination of entity id and label text
     */
    public async writeLabels(labels: string[], entityId: string): Promise<void> {
        await Promise.all(
            labels.map((label) =>
                this.labelCollConnection.replaceOne({ entityId, label }, { entityId, label }, { upsert: true }),
            ),
        );
    }

    /**
     * Uses autocomplete index to return search topic
     * suggestions based on partial text entry
     */
    public async searchLabelOptions(
        text: string,
        entityId: string,
        limit = 5,
    ): Promise<(Pick<MongoAnnotationLabelCollectionDoc, '_id' | 'label'> & { score: number })[]> {
        const pipeline = [
            {
                $search: {
                    index: IndexName.TOPIC_SEARCH,
                    compound: {
                        must: [
                            {
                                text: {
                                    query: entityId,
                                    path: 'entityId',
                                },
                            },
                        ],
                        should: [
                            {
                                autocomplete: {
                                    query: text,
                                    path: 'label',
                                    fuzzy: {
                                        maxEdits: 1,
                                        prefixLength: 1,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            { $limit: limit },
            {
                $project: {
                    label: 1,
                    score: { $meta: 'searchScore' },
                },
            },
        ];

        const cursor = this.labelCollConnection.aggregate(pipeline);
        return (await cursor.toArray()) as (Pick<MongoAnnotationLabelCollectionDoc, '_id' | 'label'> & {
            score: number;
        })[];
    }

    public get elementCollConnection() {
        return this.client.db(this.dbName).collection<MongoDataElementCollectionDoc>(MongoDBService.elementCollection);
    }

    public get authorCollConnection() {
        return this.client.db(this.dbName).collection<MongoAuthorCollectionDoc>(MongoDBService.authorCollection);
    }

    public get labelCollConnection() {
        return this.client
            .db(this.dbName)
            .collection<MongoAnnotationLabelCollectionDoc>(MongoDBService.labelCollection);
    }
}
