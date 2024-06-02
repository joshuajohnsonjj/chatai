import { ChatResponseTone } from './chat-store';
import { DataSyncInterval } from './responses';

export enum UserType {
    INDIVIDUAL = 'INDIVIDUAL',
    ORGANIZATION_MEMBER = 'ORGANIZATION_MEMBER',
}

export enum EntityType {
    INDIVIDUAL = 'INDIVIDUAL',
    ORGANIZATION = 'ORGANIZATION',
}

export interface UserSettings {
    newsletterNotification: boolean;
    usageNotification: boolean;
    chatCreativity: number;
    chatMinConfidence: number;
    chatTone: ChatResponseTone;
    baseInstructions: string | null;
}

export interface UserInfo {
    id: string;
    type: UserType;
    planId: string | null;
    organizationId: string | null;
    email: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    phoneNumber: string | null;
    stripeCustomerId: string | null;
    settings: UserSettings;
}

export interface OrgInfo {
    id: string | null;
    planId: string | null;
    isAccountActive: boolean | null;
    name: string | null;
}

export interface AccountPlan {
    isActive: boolean;
    adHocUploadsEnabled: boolean;
    dailyMessageQuota: number | null;
    dailyQueryQuota: number | null;
    dataSyncInterval: DataSyncInterval;
    integrationsEnabled: boolean;
    maxDataSources: number | null;
    isAdfree: boolean;
    maxStorageMegaBytes: number;
    stripeProductId: string;
}
