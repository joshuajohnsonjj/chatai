export interface InitiateImportRequestData {
    dataSourceId: string;
    dataSourceType: string;
    secret: string;
    ownerEntityId: string;
    lastSync?: string | null;
    userId?: string;
}

export interface TestCredentialsRequestData {
    dataSourceTypeName: string;
    secret: string;
    externalId?: string;
}

export interface InitiateGoogleDriveWebhookRequestData {
    ownerEntityId: string;
    secret: string;
}

export interface KillGoogleDriveWebhookRequestData {
    connectionId: string;
    resourceId: string;
    secret: string;
}
