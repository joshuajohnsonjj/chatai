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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIWrapper = void 0;
const generative_ai_1 = require("@google/generative-ai");
const types_1 = require("./types");
class OpenAIWrapper {
    constructor(secretKey) {
        this.getTextEmbedding = (textInput) => __awaiter(this, void 0, void 0, function* () {
            const model = this.client.getGenerativeModel({ model: types_1.GeminiModels.EMBEDDINGS });
            const result = yield model.embedContent(textInput);
            const embedding = result.embedding;
            return embedding.values;
        });
        this.getGptReponseFromSourceData = (userPrompt, sourceData, history) => __awaiter(this, void 0, void 0, function* () {
            const prompt = this.buildPromptWithSourceData(userPrompt, sourceData);
            const model = this.client.getGenerativeModel({ model: types_1.GeminiModels.TEXT });
            if (history) {
                return this.getChatContinuationResponse(model, prompt, history);
            }
            else {
                return this.getOneOffResponse(model, prompt);
            }
        });
        this.client = new generative_ai_1.GoogleGenerativeAI(secretKey);
    }
    getChatContinuationResponse(model, prompt, history) {
        return __awaiter(this, void 0, void 0, function* () {
            const chat = model.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: 100,
                },
            });
            const result = yield chat.sendMessage(prompt);
            return result.response.text();
        });
    }
    getOneOffResponse(model, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield model.generateContent(prompt);
            return result.response.text();
        });
    }
    buildPromptWithSourceData(userPrompt, sourceData, basePrompt) {
        const defaultInstructions = 'Use the provided context to help inform your response to the prompt. Respond as if you were speaking in a professional setting.';
        const instructions = basePrompt !== null && basePrompt !== void 0 ? basePrompt : defaultInstructions;
        return `
            Instructions: ${instructions}
            ---------------------------------------------------------------------------------------------
            Prompt: ${userPrompt}
            ---------------------------------------------------------------------------------------------
            Context: ${sourceData.join('. ')}
        `;
    }
}
exports.OpenAIWrapper = OpenAIWrapper;
