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