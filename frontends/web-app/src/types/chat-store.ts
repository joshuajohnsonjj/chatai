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
