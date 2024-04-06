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
class QdrantWrapper {
    constructor(hostUrl, port, collection) {
        this.queryQdrant = (vectorizedQuery, entityId) => __awaiter(this, void 0, void 0, function* () {
            const searchResult = yield this.client.search(this.collection, {
                vector: vectorizedQuery,
                filter: {
                    must: [
                        { key: types_1.TQdrantPayloadKey.ENTITY_ID, match: { value: entityId } }
                    ]
                },
                with_payload: true,
                limit: 3
            });
            return (0, compact_1.default)(searchResult.map((result) => { var _a; return (_a = result.payload) === null || _a === void 0 ? void 0 : _a.text; }));
        });
        this.upsertQdrant = (recordId, vectorizedText, text, dataSourceId, ownerEntityId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.upsert(this.collection, {
                    points: [
                        {
                            id: recordId,
                            payload: {
                                [types_1.TQdrantPayloadKey.TEXT]: text,
                                [types_1.TQdrantPayloadKey.DATASOURCE_ID]: dataSourceId,
                                [types_1.TQdrantPayloadKey.ENTITY_ID]: ownerEntityId,
                            },
                            vector: vectorizedText
                        }
                    ]
                });
                return true;
            }
            catch (error) {
                console.log(error.message);
                return false;
            }
        });
        this.deleteQdrantVectorById = (recordId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.delete(this.collection, {
                    points: [recordId]
                });
                return true;
            }
            catch (error) {
                console.log(error.message);
                return false;
            }
        });
        this.deleteQdrantVectorsByEntityId = (entityId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.client.delete(this.collection, {
                    filter: {
                        must: [
                            {
                                key: types_1.TQdrantPayloadKey.ENTITY_ID,
                                match: {
                                    value: entityId
                                }
                            }
                        ]
                    }
                });
                return true;
            }
            catch (error) {
                console.log(error.message);
                return false;
            }
        });
        this.client = new js_client_rest_1.QdrantClient({ host: hostUrl, port });
        this.collection = collection;
    }
}
exports.QdrantWrapper = QdrantWrapper;
