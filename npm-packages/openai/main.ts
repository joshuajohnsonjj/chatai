import { type GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ChatHistory, GeminiModels } from './types';
import axios from 'axios';

// TODO: implement 

export class GeminiService {
    private readonly client: GoogleGenerativeAI;

    constructor(secretKey: string) {
        this.client = new GoogleGenerativeAI(secretKey);
    }

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
}
