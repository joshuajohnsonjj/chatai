export interface IQdrantQueryResponse {
    id: string;
    version: number;
    score: number;
    payload: {
        text: string;
        entityId: string;
    };
    vector: number[];
}

export enum TQdrantPayloadKey {
    TEXT = 'text',
    ENTITY_ID = 'ownerId',
    DATASOURCE_ID = 'dataSourceId',
}

export enum QdrantDataSource {
    NOTION = 'notion',
    SLACK = 'slack',
}

export interface QdrantPayload {
    text: string;
    date: number; // Unix timestamp
    dataSource: QdrantDataSource;
    ownerId: string;

    url?: string;
    authorName?: string;

    // slack specific fields
    slackChannelId?: string;
    slackChannelName?: string;
}
