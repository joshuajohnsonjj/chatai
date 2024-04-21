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
exports.QdrantWrapper = void 0;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const types_1 = require("./types");
const compact_1 = __importDefault(require("lodash/compact"));
const pick_1 = __importDefault(require("lodash/pick"));
class QdrantWrapper {
    constructor(hostUrl, collection, apiKey) {
        /**
         * Returns up to top 4 matching embeddings with a minimum confidence
         * score of 67.5% as array of objects containing point id (which
         * corresponds to document in Dynamo) and confidence score.
         */
        this.query = (vectorizedQuery, entityId) => __awaiter(this, void 0, void 0, function* () {
            const searchResult = yield this.client.search(this.collection, {
                vector: vectorizedQuery,
                filter: {
                    must: [{ key: types_1.TQdrantPayloadKey.ENTITY_ID, match: { value: entityId } }],
                },
                with_payload: false,
                with_vector: false,
                score_threshold: 0.675,
                limit: 4,
            });
            return (0, compact_1.default)(searchResult.map((result) => (0, pick_1.default)(result, ['id', 'score'])));
        });
        this.upsert = (recordId, vectorizedText, payload) => __awaiter(this, void 0, void 0, function* () {
            yield this.client.upsert(this.collection, {
                points: [
                    {
                        id: recordId,
                        payload: payload,
                        vector: vectorizedText,
                    },
                ],
            });
        });
        this.deleteVectorById = (recordId) => __awaiter(this, void 0, void 0, function* () {
            yield this.client.delete(this.collection, {
                points: [recordId],
            });
        });
        this.deleteVectorsByEntityId = (entityId) => __awaiter(this, void 0, void 0, function* () {
            yield this.client.delete(this.collection, {
                filter: {
                    must: [
                        {
                            key: types_1.TQdrantPayloadKey.ENTITY_ID,
                            match: {
                                value: entityId,
                            },
                        },
                    ],
                },
            });
        });
        this.client = new js_client_rest_1.QdrantClient({ url: hostUrl, apiKey });
        this.collection = collection;
    }
}
exports.QdrantWrapper = QdrantWrapper;
