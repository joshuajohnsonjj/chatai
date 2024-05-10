import { ChatResponseTone } from './chat-store';

export enum UserType {
    INDIVIDUAL = 'INDIVIDUAL',
    ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
}

export enum EntityType {
    INDIVIDUAL = 'INDIVIDUAL',
    ORGANIZATION = 'ORGANIZATION',
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
    settings: {
        newsletterNotification: boolean;
        usageNotification: boolean;
        chatCreativity: number;
        chatMinConfidence: number;
        chatTone: ChatResponseTone;
        baseInstructions: string | null;
    };
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
