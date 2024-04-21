import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantPayload, TQdrantPayloadKey } from './types';
import compact from 'lodash/compact';
import pick from 'lodash/pick';

export class QdrantWrapper {
    private readonly client: QdrantClient;
    private readonly collection: string;

    constructor(hostUrl: string, collection: string, apiKey: string) {
        this.client = new QdrantClient({ url: hostUrl, apiKey });
        this.collection = collection;
    }

    /**
     * Returns up to top 4 matching embeddings with a minimum confidence
     * score of 67.5% as array of objects containing point id (which
     * corresponds to document in Dynamo) and confidence score.
     */
    public query = async (vectorizedQuery: number[], entityId: string): Promise<{ id: string; score: number }[]> => {
        const searchResult = await this.client.search(this.collection, {
            vector: vectorizedQuery,
            filter: {
                must: [{ key: TQdrantPayloadKey.ENTITY_ID, match: { value: entityId } }],
            },
            with_payload: false,
            with_vector: false,
            score_threshold: 0.675,
            limit: 4,
        });

        return compact(searchResult.map((result) => pick(result, ['id', 'score']) as { id: string; score: number }));
    };

    public upsert = async (recordId: string, vectorizedText: number[], payload: QdrantPayload): Promise<void> => {
        await this.client.upsert(this.collection, {
            points: [
                {
                    id: recordId,
                    payload: payload as Record<keyof QdrantPayload, string | number>,
                    vector: vectorizedText,
                },
            ],
        });
    };

    public deleteVectorById = async (recordId: string): Promise<void> => {
        await this.client.delete(this.collection, {
            points: [recordId],
        });
    };

    public deleteVectorsByEntityId = async (entityId: string): Promise<void> => {
        await this.client.delete(this.collection, {
            filter: {
                must: [
                    {
                        key: TQdrantPayloadKey.ENTITY_ID,
                        match: {
                            value: entityId,
                        },
                    },
                ],
            },
        });
    };
}
