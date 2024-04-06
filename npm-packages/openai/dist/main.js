"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIWrapper = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("./types");
class OpenAIWrapper {
    constructor(secretKey) {
        this.getTextEmbedding = (textInput) => __awaiter(this, void 0, void 0, function* () {
            const embeddingResponse = yield this.client.embeddings.create({ input: textInput, model: types_1.TOpenAIModels.EMBEDDINGS });
            return embeddingResponse.data[0].embedding;
        });
        this.getGptReponseFromSourceData = (basePrompt, sourceData) => __awaiter(this, void 0, void 0, function* () {
            const prompt_start = 'Answer the question based on the context below.\n\n' +
                'Context:\n';
            const prompt_end = `\n\nQuestion: ${basePrompt}\nAnswer:`;
            const limit = 3750;
            let prompt = '';
            for (let i = 1; i < sourceData.length; i++) {
                if (('\n\n---\n\n' + sourceData.slice(0, i).join('\n\n---\n\n')).length >=
                    limit) {
                    prompt =
                        prompt_start +
                            '\n\n---\n\n' +
                            sourceData.slice(0, i - 1).join('\n\n---\n\n') +
                            prompt_end;
                    break;
                }
                else if (i === sourceData.length - 1) {
                    prompt =
                        prompt_start +
                            '\n\n---\n\n' +
                            sourceData.join('\n\n---\n\n') +
                            prompt_end;
                }
            }
            const openAiResponse = yield this.client.completions.create({
                model: types_1.TOpenAIModels.COMPLETIONS,
                prompt,
                temperature: 1.25,
                max_tokens: 400,
                frequency_penalty: 0,
                presence_penalty: 0,
                stop: null
            });
            return openAiResponse.choices[0].text;
        });
        this.client = new openai_1.default({ apiKey: secretKey });
        ;
    }
}
exports.OpenAIWrapper = OpenAIWrapper;
