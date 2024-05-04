import { type GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import {
    AnalyizeTextReqPayload,
    AnalyizeTextResponse,
    ChatHistory,
    CleanedAnalyzeTextResponse,
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

    /**
     * TODO: Further refine the entity cleaning... we get a decent amount of bullshit at the moment
     * Uses NLP to get relative category/keyword info from text
     */
    public getTextAnnotation = async (
        textInput: string,
        minCategoryConfidence = 0.65,
        minEntityConfidence = 0.825,
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

    public getGptReponseFromSourceData = async (
        userPrompt: string,
        sourceData: string[],
        history?: ChatHistory[],
    ): Promise<string> => {
        const prompt = this.buildPromptWithSourceData(userPrompt, sourceData);
        const model = this.client.getGenerativeModel({ model: GeminiModels.TEXT });

        if (history) {
            return this.getChatContinuationResponse(model, prompt, history);
        } else {
            return this.getOneOffResponse(model, prompt);
        }
    };

    private async getChatContinuationResponse(
        model: GenerativeModel,
        prompt: string,
        history: ChatHistory[],
    ): Promise<string> {
        const chat = model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 100,
            },
        });

        const result = await chat.sendMessage(prompt);
        return result.response.text();
    }

    private async getOneOffResponse(model: GenerativeModel, prompt: string): Promise<string> {
        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    private buildPromptWithSourceData(userPrompt: string, sourceData: string[], basePrompt?: string): string {
        const defaultInstructions =
            'Use the provided context to help inform your response to the prompt. Respond as if you were speaking in a professional setting.';
        const instructions = basePrompt ?? defaultInstructions;

        return `
            Instructions: ${instructions}
            ---------------------------------------------------------------------------------------------
            Prompt: ${userPrompt}
            ---------------------------------------------------------------------------------------------
            Context: ${sourceData.join('. ')}
        `;
    }

    private cleanTextAnnotation = (
        raw: AnalyizeTextResponse,
        minCategoryConfidence: number,
        minEntityConfidence: number,
    ): CleanedAnalyzeTextResponse => ({
        entities: raw.entities
            .filter(
                (entity) =>
                    IMPORTABLE_ENTITY_TYPES.includes(entity.type) &&
                    entity.mentions[0]?.probability >= minEntityConfidence,
            )
            .map((entity) => entity.name),
        categories: raw.categories.filter((cat) => cat.confidence >= minCategoryConfidence).map((cat) => cat.name),
    });
}
