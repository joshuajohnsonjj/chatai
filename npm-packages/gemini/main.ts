import { type GenerativeModel, GoogleGenerativeAI, GenerateContentStreamResult } from '@google/generative-ai';
import {
    type AnalyizeTextReqPayload,
    type AnalyizeTextResponse,
    type ChatHistory,
    type ChatSettings,
    type CleanedAnalyzeTextResponse,
    GeminiModels,
    ChatTone,
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

    public getGptReponseFromSourceData = async (
        userPrompt: string,
        sourceData: string,
        settings: ChatSettings,
        history?: ChatHistory[],
    ): Promise<GenerateContentStreamResult> => {
        const prompt = this.buildPromptWithSourceData(
            userPrompt,
            sourceData,
            settings.toneSetting,
            settings.baseInstructions,
        );

        const model = this.client.getGenerativeModel({
            model: GeminiModels.TEXT,
            generationConfig: { temperature: this.normalizeTemperature(settings.creativitySetting) },
        });

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
    ): Promise<GenerateContentStreamResult> {
        const chat = model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 100,
            },
        });

        return chat.sendMessageStream(prompt);
    }

    private async getOneOffResponse(model: GenerativeModel, prompt: string): Promise<GenerateContentStreamResult> {
        return model.generateContentStream(prompt);
    }

    private buildPromptWithSourceData(
        userPrompt: string,
        sourceData: string,
        tone: ChatTone,
        baseInstructions?: string | null,
    ): string {
        let instructions =
            'Use the data that followes as a basis to help inform your response, if possible, or do your best if the data is inadequate.';
        if (tone !== ChatTone.DEFAULT) {
            instructions += this.buildTonePrompt(tone);
        }
        if (baseInstructions) {
            instructions += baseInstructions;
        }

        return `${userPrompt}.\nInstructions: ${instructions}\nData:\n${sourceData}`;
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
            .map((entity) => this.toStartCase(entity.name)),
        categories: raw.categories.filter((cat) => cat.confidence >= minCategoryConfidence).map((cat) => cat.name),
    });

    private toStartCase(str: string): string {
        return str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
            return match.toUpperCase();
        });
    }

    private normalizeTemperature(value: number): number {
        const temperatureMax = 1;
        const temperatureMin = 0;
        const settingsMax = 9;
        const settingsMin = 1;

        const normalizedValue = (value - settingsMin) / (settingsMax - settingsMin);
        const normalized = normalizedValue * (temperatureMax - temperatureMin) + temperatureMin;

        return normalized;
    }

    private buildTonePrompt(tone: ChatTone): string {
        switch (tone) {
            case ChatTone.CASUAL:
                return ' Respond in a very casual tone. ';
            case ChatTone.PROFESSIONAL:
                return ' Respond in a very professional tone. ';
            default:
                return '';
        }
    }
}
