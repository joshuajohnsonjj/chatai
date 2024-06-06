export interface InitiateImportRequestData {
    dataSourceId: string;
    dataSourceType: string;
    secret: string;
    ownerEntityId: string;
    lastSync?: string | null;
    userId?: string;
}

export interface InitiateImportWithOAuthRequestData extends InitiateImportRequestData {
    refreshToken: string;
}

export interface TestCredentialsRequestData {
    dataSourceTypeName: string;
    secret: string;
    externalId?: string;
}
