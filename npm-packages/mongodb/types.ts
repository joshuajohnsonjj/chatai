/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MongoDataElementCollectionDoc {
    // common fields
    _id: string;
    ownerEntityId: string;
    text: string;
    embedding: number[];
    createdAt: number; // Unix timestamp
    url?: string;
    authorName?: string;
    authorRef?: string;
    annotations: string[];
    dataSourceType: string;

    // slack specific fields
    slackChannelId?: string;
    slackChannelName?: string;
}

export interface MongoAuthorCollectionDoc {
    _id: string;
    organizationId: string;
    name: string;
    email?: string;
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
