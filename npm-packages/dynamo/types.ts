export enum DynamoTables {
    ImportsDataStore = 'ImportsDataStore',
}

export enum DynamoAttributes {
    ID = 'id',
    OWNER_ID = 'ownerEntityId',
    TEXT = 'text',
    CREATED_AT = 'createdAt',
    AUTHOR_NAME = 'authorName',
    URL = 'url',
    SLACK_CHANNEL_ID = 'slackChannelId',
    SLACK_CHANNEL_NAME = 'slackChannelName',
}

export interface DynamoDataStoreDocument {
    id: string;
    ownerEntityId: string;
    text: string;
    createdAt: string;
    url?: string;
    authorName?: string;

    // slack specific fields
    slackChannelId?: string;
    slackChannelName?: string;
}
