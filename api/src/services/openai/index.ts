import OpenAI from 'openai';
import { OpenAIMessageAuthorType, OpenAIModels } from './constants';
import { type ChatMessage, ChatTone, type EntitySettings } from '@prisma/client';

export type OpenAIMessageHistory = OpenAI.Chat.Completions.ChatCompletionMessageParam[];

export class OpenAIService {
    private readonly client: OpenAI;

    constructor(secretKey: string) {
        this.client = new OpenAI({ apiKey: secretKey });
    }

    public getGptReponseStreamWithSourceData = async (
        userId: string,
        userPrompt: string,
        sourceData: string,
        settings: Pick<EntitySettings, 'chatCreativity' | 'chatTone' | 'baseInstructions'>,
        history?: OpenAIMessageHistory,
    ) => {
        const messages = history ?? [];

        const prompt = this.buildPromptWithSourceData(
            userPrompt,
            sourceData,
            settings.chatTone,
            settings.baseInstructions,
        );

        messages.push({
            role: OpenAIMessageAuthorType.USER,
            content: prompt,
        });

        return await this.client.chat.completions.create({
            messages,
            model: OpenAIModels.CHAT,
            temperature: this.normalizeTemperature(settings.chatCreativity),
            stream: true,
            user: userId,
        });
    };

    public buildGptHistoryFromRawMessages = (messages: ChatMessage[]): OpenAIMessageHistory =>
        messages.map((message) => ({
            role: message.isSystemMessage ? OpenAIMessageAuthorType.ASSISTANT : OpenAIMessageAuthorType.USER,
            content: message.text,
        }));

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

    private normalizeTemperature(value: number): number {
        const temperatureMax = 2;
        const temperatureMin = 0;
        const settingsMax = 9;
        const settingsMin = 1;

        const normalizedValue = (value - settingsMin) / (settingsMax - settingsMin);
        const normalized = normalizedValue * (temperatureMax - temperatureMin) + temperatureMin;

        return normalized;
    }
}
