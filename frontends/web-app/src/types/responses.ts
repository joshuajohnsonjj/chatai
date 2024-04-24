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
