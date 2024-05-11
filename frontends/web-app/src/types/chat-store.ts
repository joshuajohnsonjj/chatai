export enum ChatResponseTone {
    CASUAL = 'CASUAL',
    DEFAULT = 'DEFAULT',
    PROFESSIONAL = 'PROFESSIONAL',
}

export interface UpdateChatParams {
    isArchived?: boolean;
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
    replyThreadId: string;
    systemResponseMessageId: string;
    creativitySetting: number;
    confidenceSetting: number;
    toneSetting: ChatResponseTone;
    baseInstructions: string | null;
}
