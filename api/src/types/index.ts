export enum OganizationUserRole {
    ORG_MEMBER = 'ORG_MEMBER',
    ORG_ADMIN = 'ORG_ADMIN',
    ORG_OWNER = 'ORG_OWNER',
}

export enum CognitoAttribute {
    FIRST_NAME = 'firstName',
    LAST_NAME = 'lastName',
    PHONE_NUMBER = 'phoneNumber',
    ORG_USER_ROLE = 'OganizationUserRole',
    ORG = 'organization',
}
