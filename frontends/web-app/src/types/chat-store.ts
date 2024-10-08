export enum ChatType {
    SYSTEM = 'SYSTEM',
}

export enum ChatResponseTone {
    CASUAL = 'CASUAL',
    DEFAULT = 'DEFAULT',
    PROFESSIONAL = 'PROFESSIONAL',
}

export interface UpdateChatParams {
    isArchived?: boolean;
    isFavorited?: boolean;
    title?: string;
    chatCreativity?: number;
    chatMinConfidence?: number;
    chatTone?: ChatResponseTone;
    baseInstructions?: string;
}

export interface SendMessageParams {
    userPromptMessageId: string;
    userPromptText: string;
    isReplyMessage: boolean;
    threadId: string;
    systemResponseMessageId: string;
    creativitySetting: number;
    confidenceSetting: number;
    toneSetting: ChatResponseTone;
    baseInstructions: string | null;
}
