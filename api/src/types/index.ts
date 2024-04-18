export enum OganizationUserRole {
    ORG_MEMBER = 'ORG_MEMBER',
    ORG_ADMIN = 'ORG_ADMIN',
    ORG_OWNER = 'ORG_OWNER',
}

export enum CognitoAttribute {
    ORG_USER_ROLE = 'custom:oganizationUserRole',
    ORG = 'custom:organization',
}
