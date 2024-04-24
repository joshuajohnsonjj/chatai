export enum UserType {
    INDIVIDUAL = 'INDIVIDUAL',
    ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
}
export interface UserInfo {
    id: string | null;
    type: UserType | null;
    planId?: string | null;
    organizationId?: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber?: string | null;
    stripeCustomerId?: string | null;
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
