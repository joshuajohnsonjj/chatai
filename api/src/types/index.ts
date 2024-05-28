export enum OganizationUserRole {
    ORG_MEMBER = 'ORG_MEMBER',
    ORG_ADMIN = 'ORG_ADMIN',
    ORG_OWNER = 'ORG_OWNER',
}

export enum CognitoAttribute {
    ORG_USER_ROLE = 'custom:oganizationUserRole',
    ORG = 'custom:organization',
}

export enum PrismaError {
    FAILED_UNIQUE_CONSTRAINT = 'P2002',
    RECORD_DOES_NOT_EXIST = 'P2025',
}

export interface CognitoIdUserPayload {
    sub: string; // user uuid
    email: string;
    'custom:oganizationUserRole'?: string;
    'custom:organization'?: string;
}

export interface APIGatewayInitiateImportParams {
    dataSourceId: string;
    dataSourceType: string;
    secret: string;
    ownerEntityId: string;
    lastSync: string | null;
    userId?: string;
}

export interface APIGatewayTestCredentialsParams {
    dataSourceTypeName: string;
    secret: string;
    externalId?: string;
}
