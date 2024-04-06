import { QdrantClient } from '@qdrant/js-client-rest';
import { TQdrantPayloadKey } from './types';
import compact from 'lodash/compact';

export class QdrantWrapper {
    private readonly client: QdrantClient;
    private readonly collection: string;

    constructor(hostUrl: string, port: number, collection: string) {
        this.client = new QdrantClient({ host: hostUrl, port });
        this.collection = collection;
    }
 
    public queryQdrant = async (
        vectorizedQuery: number[],
        entityId: string
    ): Promise<string[]> => {
        const searchResult = await this.client.search(this.collection, {
            vector: vectorizedQuery,
            filter: {
                must: [
                    { key: TQdrantPayloadKey.ENTITY_ID, match: { value: entityId } }
                ]
            },
            with_payload: true,
            limit: 3
        });

        return compact(searchResult.map((result) => result.payload?.text)) as string[];
    };

    public upsertQdrant = async (
        recordId: string,
        vectorizedText: number[],
        text: string,
        dataSourceId: string,
        ownerEntityId: string
    ): Promise<boolean> => {
        try {
            await this.client.upsert(this.collection, {
                points: [
                    {
                        id: recordId,
                        payload: {
                            [TQdrantPayloadKey.TEXT]: text,
                            [TQdrantPayloadKey.DATASOURCE_ID]: dataSourceId,
                            [TQdrantPayloadKey.ENTITY_ID]: ownerEntityId,
                        },
                        vector: vectorizedText
                    }
                ]
            });
            return true;
        } catch (error: any) {
            console.log(error.message);
            return false;
        }
    };

    public deleteQdrantVectorById = async (recordId: string): Promise<boolean> => {
        try {
            await this.client.delete(this.collection, {
                points: [recordId]
            });
            return true;
        } catch (error: any) {
            console.log(error.message);
            return false;
        }
    };

    public deleteQdrantVectorsByEntityId = async (
        entityId: string
    ): Promise<boolean> => {
        try {
            await this.client.delete(this.collection, {
                filter: {
                    must: [
                        {
                            key: TQdrantPayloadKey.ENTITY_ID,
                            match: {
                                value: entityId
                            }
                        }
                    ]
                }
            });
            return true;
        } catch (error: any) {
            console.log(error.message);
            return false;
        }
    };
}
