export interface IQdrantQueryResponse {
  id: string
  version: number
  score: number
  payload: {
    text: string
    entityId: string
  }
  vector: number[]
}

export enum TQdrantPayloadKey {
  TEXT = 'text',
  ENTITY_ID = 'ownerEntityId',
  DATASOURCE_ID = 'dataSourceId',
}

export enum QdrantDataSource {
  NOTION = 'notion',
}

export interface QdrantPayload {
  text: string;
  date: number; // Unix timestamp
  url?: string;
  dataSource: QdrantDataSource;
  sourceDataType: string;
  authorName?: string;
  authorEmail?: string;
  ownerId: string;
}
