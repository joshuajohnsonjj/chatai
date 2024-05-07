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
    lastMessage: {
        timestamp: Date;
        text: string;
        isSystemMessage: boolean;
    };
}

export interface ListChatHistoryResponse {
    page: number;
    size: number;
    threads: ChatThreadResponse[];
}

export interface ChatThreadResponse {
    threadId: string;
    messages: ChatMessageResponse[];
}

export interface ChatMessageResponse {
    id: string;
    text: string;
    isSystemMessage: boolean;
    chatId: string;
    threadId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserInfoResponse {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: string;
    planId: string | null;
    organizationId: string | null;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    stripeCustomerId: string | null;
    organization: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        planId: string;
        isAccountActive: boolean;
        name: string;
    } | null;
    plan: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        adHocUploadsEnabled: boolean;
        dailyMessageQuota: number;
        dataSyncInterval: string;
        integrationsEnabled: boolean;
        maxDataSources: number;
        stripeProductId: string;
    } | null;
}

export interface DataSourceConnectionsResponse {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    lastSync: Date | null;
    dataSourceTypeId: string;
    ownerEntityId: string;
    ownerEntityType: string;
    hasExternalId: boolean;
    isSyncing: boolean;
    dataSourceName: string;
    dataSourceLiveSyncAvailable: boolean;
}

export interface DataSourceTypesResponse {
    id: string;
    name: string;
    category: string;
    isLiveSyncAvailable: boolean;
    userConnectedDataSourceId?: string;
}

export interface TestDataSourceConnectionResponse {
    isValid: boolean;
    message: string;
}

export interface SearchResult {
    _id: string;
    ownerEntityId: string;
    text: string;
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
