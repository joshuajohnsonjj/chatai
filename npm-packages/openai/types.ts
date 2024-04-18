export enum GeminiModels {
    EMBEDDINGS = 'embedding-001',
    TEXT = 'gemini-pro',
}

export interface ChatHistory {
    role: 'user' | 'model';
    parts: {
        text: string;
    }[];
}
