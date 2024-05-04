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

export interface AnalyizeTextReqPayload {
    document: {
        type: 'PLAIN_TEXT';
        content: string;
    };
    features: {
        extractEntities: boolean;
        extractDocumentSentiment: boolean;
        classifyText: boolean;
        moderateText: boolean;
    };
    encodingType: 'UTF16';
}

export enum TextAnalysisEntityType {
    UNKNOWN = 'UNKNOWN',
    PERSON = 'PERSON',
    LOCATION = 'LOCATION',
    ORGANIZATION = 'ORGANIZATION',
    EVENT = 'EVENT',
    WORK_OF_ART = 'WORK_OF_ART',
    CONSUMER_GOOD = 'CONSUMER_GOOD',
    OTHER = 'OTHER',
    PHONE_NUMBER = 'PHONE_NUMBER',
    ADDRESS = 'ADDRESS',
    DATE = 'DATE',
    NUMBER = 'NUMBER',
    PRICE = 'PRICE',
}

export interface TextAnalyisisEntity {
    name: string;
    type: TextAnalysisEntityType;
    metadata: Record<string, string>;
    mentions: {
        text: {
            content: string;
            beginOffset: number;
        };
        type: 'TYPE_UNKNOWN' | 'PROPER' | 'COMMON';
        sentiment: never;
        probability: number;
    }[];
    sentiment: never;
}

/**
 * Catergory name options:
 * https://cloud.google.com/natural-language/docs/categories
 */
export interface TextAnalyisisCategory {
    name: string;
    confidence: number;
}

export interface AnalyizeTextResponse {
    sentences: never;
    entities: TextAnalyisisEntity[];
    documentSentiment: never;
    languageCode: string;
    categories: TextAnalyisisCategory[];
    moderationCategories: never;
    languageSupported: boolean;
}

export interface CleanedAnalyzeTextResponse {
    entities: string[];
    categories: string[];
}
