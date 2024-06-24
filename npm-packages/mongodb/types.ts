/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DataElementInsertSummary {
    isNew: boolean;
    lengthDiff: number;
}

export interface MongoDataElementCollectionDoc {
    // common fields
    _id: string;
    ownerEntityId: string;
    text: string;
    title: string;
    embedding: number[];
    createdAt: number; // Unix timestamp (when the original content was created in datasource)
    modifiedAt: number; // Unix timestamp (when written/rewrittern to our platform)
    url?: string;
    author?: {
        name: string;
        email: string;
    };
    annotations: string[];
    dataSourceType: string;

    // slack specific fields
    slackChannelId?: string;
    slackChannelName?: string;

    // google drive specific fields
    fileId?: string;
    filePartIndex?: number;

    // gmail specifc fields
    threadId?: string;
}

export interface MongoAuthorCollectionDoc {
    _id: string;
    entityId: string;
    name: string;
    email: string;
}

export interface MongoAnnotationLabelCollectionDoc {
    _id: string;
    entityId: string;
    label: string;
}

export interface VectorQueryFilter {
    $and?: any;
}

export interface QueryFilter {
    ownerEntityId: any;
    createdAt?: any;
    authorName?: any;
    annotations?: any;
    dataSourceType?: any;
}

export interface DataElementQueryInput {
    entityId: string;
    topics?: string[];
    sourceTypeFilters?: string[];
    authorFilters?: string[];
    dateRangeLower?: number; // Unix timestamp
    dateRangeUpper?: number; // Unix timestamp
}

export type DataElementVectorInput = { vectorizedQuery: number[] } & DataElementQueryInput;

export enum IndexName {
    VECTOR = 'vector_index',
    TOPIC_SEARCH = 'label_search',
    AUTHOR_SEARCH = 'author_search',
}
