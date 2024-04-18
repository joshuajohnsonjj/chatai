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
}

export interface CognitoIdUserPayload {
    sub: string; // user uuid
    email: string;
    'custom:oganizationUserRole'?: string;
    'custom:organization'?: string;
}
