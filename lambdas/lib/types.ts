export interface InitiateImportRequestData {
    dataSourceId: string;
    dataSourceType: string;
    userId: string;
    secret: string;
    ownerEntityId: string;
    lastSync: string | null;
}

export interface TestCredentialsRequestData {
    dataSourceTypeName: string;
    secret: string;
    externalId?: string;
}
