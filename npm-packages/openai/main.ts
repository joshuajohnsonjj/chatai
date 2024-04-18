import { type GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { ChatHistory, GeminiModels } from './types';

export class OpenAIWrapper {
    private readonly client: GoogleGenerativeAI;

    constructor(secretKey: string) {
        this.client = new GoogleGenerativeAI(secretKey);
    }

    public getTextEmbedding = async (textInput: string): Promise<number[]> => {
        const model = this.client.getGenerativeModel({ model: GeminiModels.EMBEDDINGS });

        const result = await model.embedContent(textInput);
        const embedding = result.embedding;

        return embedding.values;
    };

    public getGptReponseFromSourceData = async (
        basePrompt: string,
        sourceData: string[],
        history?: ChatHistory[],
    ): Promise<string> => {
        const prompt = this.buildPromptWithSourceData(basePrompt, sourceData);
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

    private buildPromptWithSourceData(basePrompt: string, sourceData: string[]): string {
        // TODO: check on limit
        const prompt_start = 'Answer the question based on the context below.\n\n' + 'Context:\n';
        const prompt_end = `\n\nQuestion: ${basePrompt}\nAnswer:`;
        const limit = 3750;

        let constructedPrompt = '';
        for (let i = 1; i < sourceData.length; i++) {
            if (('\n\n---\n\n' + sourceData.slice(0, i).join('\n\n---\n\n')).length >= limit) {
                constructedPrompt =
                    prompt_start + '\n\n---\n\n' + sourceData.slice(0, i - 1).join('\n\n---\n\n') + prompt_end;
                break;
            } else if (i === sourceData.length - 1) {
                constructedPrompt = prompt_start + '\n\n---\n\n' + sourceData.join('\n\n---\n\n') + prompt_end;
            }
        }

        return constructedPrompt;
    }
}
