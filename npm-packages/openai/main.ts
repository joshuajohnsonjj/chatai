import OpenAI from 'openai';
import { TOpenAIModels } from './types';

export class OpenAIWrapper {
    private readonly client: OpenAI;

    constructor(secretKey: string) {
        this.client = new OpenAI({ apiKey: secretKey });;
    }

    public getTextEmbedding = async (textInput: string): Promise<number[]> => {
        const embeddingResponse = await this.client.embeddings.create({ input: textInput, model: TOpenAIModels.EMBEDDINGS });
        return embeddingResponse.data[0].embedding;
    };

    public getGptReponseFromSourceData = async (
        basePrompt: string,
        sourceData: string[]
    ): Promise<string> => {
        const prompt_start =
        'Answer the question based on the context below.\n\n' +
        'Context:\n';
        const prompt_end = `\n\nQuestion: ${basePrompt}\nAnswer:`;
        const limit = 3750;

        let prompt = '';
        for (let i = 1; i < sourceData.length; i++) {
            if (
                ('\n\n---\n\n' + sourceData.slice(0, i).join('\n\n---\n\n')).length >=
                limit
            ) {
                prompt =
                    prompt_start +
                    '\n\n---\n\n' +
                    sourceData.slice(0, i - 1).join('\n\n---\n\n') +
                    prompt_end;
                break;
            } else if (i === sourceData.length - 1) {
                prompt =
                    prompt_start +
                    '\n\n---\n\n' +
                    sourceData.join('\n\n---\n\n') +
                    prompt_end;
            }
        }

        const openAiResponse = await this.client.completions.create({
            model: TOpenAIModels.COMPLETIONS,
            prompt,
            temperature: 1.25,
            max_tokens: 400,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null
        });

        return openAiResponse.choices[0].text;
    };
}
