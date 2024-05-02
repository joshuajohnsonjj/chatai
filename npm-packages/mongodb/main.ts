import { type Document, MongoClient } from 'mongodb';
import type {
    DataElementQueryInput,
    DataElementVectorInput,
    MongoAnnotationLabelCollectionDoc,
    MongoAuthorCollectionDoc,
    MongoDataElementCollectionDoc,
    QueryFilter,
    VectorQueryFilter,
} from './types';

/**
 * ## Wrapper for mongo db client
 *
 * **NOTE:** Need to call the init() method to
 * open connection and the terminate() to close
 */
export class MongoDBService {
    private readonly client: MongoClient;

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
        await this.client.connect();
    }

    /**
     * Must call this at end of use
     */
    public async terminate() {
        await this.client.close();
    }

    /**
     * getter for adhoc interactions with data element collection
     */
    public get elementCollConnection() {
        return this.client.db(this.dbName).collection<MongoDataElementCollectionDoc>(MongoDBService.elementCollection);
    }

    /**
     * getter for adhoc interactions with authors collection
     */
    public get authorCollConnection() {
        return this.client.db(this.dbName).collection<MongoAuthorCollectionDoc>(MongoDBService.authorCollection);
    }

    /**
     * getter for adhoc interactions with labels collection
     */
    public get labelCollConnection() {
        return this.client
            .db(this.dbName)
            .collection<MongoAnnotationLabelCollectionDoc>(MongoDBService.labelCollection);
    }

    public async getDataElementById(id: string): Promise<MongoDataElementCollectionDoc | null> {
        return await this.elementCollConnection.findOne({ _id: id });
    }

    public async queryDataElements(
        query: DataElementQueryInput,
        skip = 0,
        limit = 50,
    ): Promise<{
        numResults: number;
        nextStartNdx: number;
        results: MongoDataElementCollectionDoc[];
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
            filters.annotations = { $all: query.sourceTypeFilters };
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

        const cursor = this.elementCollConnection.find(filters).limit(limit).skip(skip);

        const [numResults, results] = await Promise.all([
            this.elementCollConnection.countDocuments(filters),
            cursor.toArray(),
        ]);

        return {
            numResults,
            nextStartNdx: skip + limit + 1,
            results,
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
    ): Promise<Partial<MongoDataElementCollectionDoc>[]> {
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

        const pipeline = [
            {
                $vectorSearch: {
                    index: 'vector_index',
                    path: 'embedding',
                    filter,
                    queryVector: query.vectorizedQuery,
                    numCandidates: limit * 15,
                    limit,
                },
            },
            {
                $project: {
                    text: 1,
                    url: 1,
                    authorName: 1,
                    annotations: 1,
                    score: { $meta: 'vectorSearchScore' },
                },
            },
        ];

        const result = this.client.db(this.dbName).collection(MongoDBService.elementCollection).aggregate(pipeline);

        return await result.toArray();
    }

    public async writeDataElements(data: MongoDataElementCollectionDoc[]): Promise<void> {
        await this.writeDocs(data, MongoDBService.elementCollection);
    }

    public async writeAuthors(data: MongoAuthorCollectionDoc[]): Promise<void> {
        await this.writeDocs(data, MongoDBService.authorCollection);
    }

    public async writeLabels(labels: string[], entityId: string): Promise<void> {
        await this.writeDocs(
            labels.map((label) => ({
                _id: `${entityId}:${label}`,
                entityId,
                label,
            })),
            MongoDBService.labelCollection,
        );
    }

    private async writeDocs(docs: Document[], coll: string): Promise<void> {
        const res = await this.client.db(this.dbName).collection(coll).insertMany(docs);

        console.log(`wrote ${Object.keys(res.insertedIds).length} documents to mongo`);
    }
}
