export enum UserType {
    INDIVIDUAL = 'INDIVIDUAL',
    ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
}
export interface UserInfo {
    id: string;
    type: UserType;
    planId: string | null;
    organizationId: string | null;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    stripeCustomerId: string | null;
}

export interface OrgInfo {
    id: string | null;
    planId: string | null;
    isAccountActive: boolean | null;
    name: string | null;
}

export interface AccountPlan {
    id: string;
}
