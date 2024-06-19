export interface InitiateImportRequestData {
    dataSourceId: string;
    dataSourceType: string;
    secret: string;
    ownerEntityId: string;
    externalId?: string;
    lastSync?: string | null;
}

export interface InitiateImportWithOAuthRequestData extends InitiateImportRequestData {
    refreshToken: string;
}

export interface TestCredentialsRequestData {
    dataSourceTypeName: string;
    secret: string;
    externalId?: string;
}
