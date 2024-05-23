import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    type AnalyizeTextReqPayload,
    type AnalyizeTextResponse,
    type CleanedAnalyzeTextResponse,
    GeminiModels,
} from './types';
import axios from 'axios';
import { IMPORTABLE_ENTITY_TYPES, NLP_URL } from './constants';

export class GeminiService {
    private readonly client: GoogleGenerativeAI;

    private readonly key: string;

    constructor(secretKey: string) {
        this.client = new GoogleGenerativeAI(secretKey);
        this.key = secretKey;
    }

    public getTextAnnotation = async (
        textInput: string,
        minCategoryConfidence = 0.35,
        minEntityConfidence = 0.51,
    ): Promise<CleanedAnalyzeTextResponse> => {
        try {
            const resp = await axios({
                method: 'post',
                url: `${NLP_URL}?key=${this.key}`,
                data: {
                    document: {
                        type: 'PLAIN_TEXT',
                        content: textInput,
                    },
                    features: {
                        extractEntities: true,
                        classifyText: true,
                        extractDocumentSentiment: false,
                        moderateText: false,
                    },
                    encodingType: 'UTF16',
                } as AnalyizeTextReqPayload,
            });
            return this.cleanTextAnnotation(resp.data, minCategoryConfidence, minEntityConfidence);
        } catch (error) {
            console.error(error);
            return {
                entities: [],
                categories: [],
            };
        }
    };

    /**
     * Generates text embedding vector values for a provided string input.
     *
     * NOTE: will truncate long strings to a max of 5000 characters in order
     * to adhear to googles max request payload size of 10000 bytes.
     */
    public getTextEmbedding = async (textInput: string): Promise<number[]> => {
        const model = this.client.getGenerativeModel({ model: GeminiModels.EMBEDDINGS });

        const result = await model.embedContent(textInput.substring(0, 5000));
        const embedding = result.embedding;

        return embedding.values;
    };

    private cleanTextAnnotation = (
        raw: AnalyizeTextResponse,
        minCategoryConfidence: number,
        minEntityConfidence: number,
    ): CleanedAnalyzeTextResponse => {
        const uniqueArray = (strArr: string[]): string[] => [...new Set(strArr)];
        return {
            entities: uniqueArray(
                raw.entities
                    .filter(
                        (entity) =>
                            IMPORTABLE_ENTITY_TYPES.includes(entity.type) &&
                            entity.mentions[0]?.probability >= minEntityConfidence,
                    )
                    .map((entity) => this.toStartCase(entity.name)),
            ),
            categories: raw.categories.filter((cat) => cat.confidence >= minCategoryConfidence).map((cat) => cat.name),
        };
    };

    private toStartCase(str: string): string {
        return str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
            return match.toUpperCase();
        });
    }
}
