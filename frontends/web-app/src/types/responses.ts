import { ChatResponseTone } from './chat-store';
import type { SearchQueryParamType } from './search-store';

export interface LoginUserResponse {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    name: string;
}

export interface ListChatsResponse {
    page: number;
    size: number;
    chats: ChatResponse[];
}

export interface ChatResponse {
    id: string;
    title: string;
    chatType: string;
    chatCreativity: number | null;
    chatMinConfidence: number | null;
    chatTone: ChatResponseTone | null;
    baseInstructions: string | null;
    isArchived: boolean;
    isFavorited: boolean;
    lastMessage?: {
        timestamp: string;
        text: string;
        isSystemMessage: boolean;
    };
}

export interface ListChatHistoryResponse {
    page: number;
    pageSize: number;
    responseSize: number;
    threads: ChatThreadResponse[];
}

export interface ChatThreadResponse {
    threadId: string;
    totalMessageCount: number;
    timestamp: string;
    messages: ChatMessageResponse[];
}

export class ChatMessageInformer {
    id: string;
    createdAt: string;
    updatedAt: string;
    messageId: string;
    name: string;
    url: string;
    sourceName: string;
    confidence: number;
}

export interface ChatMessageResponse {
    id: string;
    text: string;
    isSystemMessage: boolean;
    chatId: string;
    threadId: string;
    createdAt: string;
    updatedAt?: string;
    informers: ChatMessageInformer[];
}

export enum DataSyncInterval {
    INSTANT = 'INSTANT',
    SEMI_DAILY = 'SEMI_DAILY',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
}

export interface UserInfoResponse {
    id: string;
    createdAt: string;
    updatedAt: string;
    type: string;
    planId: string | null;
    organizationId: string | null;
    email: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    phoneNumber: string | null;
    stripeCustomerId: string | null;
    organization: {
        id: string;
        createdAt: string;
        updatedAt: string;
        planId: string;
        isAccountActive: boolean;
        name: string;
    } | null;
    plan: {
        id: string;
        createdAt: string;
        updatedAt: string;
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
    } | null;
    settings: {
        newsletterNotification: boolean;
        usageNotification: boolean;
        chatCreativity: number;
        chatMinConfidence: number;
        chatTone: ChatResponseTone;
        baseInstructions: string | null;
    };
}

export interface DataSourceConnectionsResponse {
    id: string;
    createdAt: string;
    updatedAt: string;
    lastSync: string | null;
    dataSourceTypeId: string;
    ownerEntityId: string;
    ownerEntityType: string;
    hasExternalId: boolean;
    isSyncing: boolean;
    dataSourceName: DataSourceTypeName;
    dataSourceLiveSyncAvailable: boolean;
    dataSourceManualSyncAllowed: boolean;
    selectedSyncInterval: DataSyncInterval;
    mbStorageEstimate: number;
    nextScheduledSync: string | null;
    additionalConfig: any;
}

export enum DataSourceTypeName {
    NOTION = 'NOTION',
    GOOGLE_DRIVE = 'GOOGLE_DRIVE',
}

export interface DataSourceTypesResponse {
    id: string;
    name: DataSourceTypeName;
    category: string;
    isLiveSyncAvailable: boolean;
    isManualSyncAllowed: boolean;
    userConnectedDataSourceId?: string;
    additionalConfigTemplate: any;
}

export interface TestDataSourceConnectionResponse {
    isValid: boolean;
    message: string;
}

export interface SearchResult {
    _id: string;
    ownerEntityId: string;
    text: string;
    title: string;
    createdAt: number; // Unix timestamp
    url?: string;
    authorName?: string;
    annotations: string[];
    dataSourceType: string;
}

export interface SearchQueryResponse {
    numResults: number;
    nextStartNdx: number;
    results: SearchResult[];
}

export interface SearchSuggestionsResponse {
    results: { type: SearchQueryParamType; value: string }[];
}
