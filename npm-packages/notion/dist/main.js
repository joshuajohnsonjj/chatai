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
exports.NotionWrapper = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
class NotionWrapper {
    constructor(secret) {
        this.testNotionConnection = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios_1.default.request({
                    method: constants_1.NotionEndpointMethods.SEARCH,
                    baseURL: constants_1.NotionBaseUrl,
                    url: constants_1.NotionEndpoints.SEARCH,
                    headers: Object.assign(Object.assign({}, constants_1.NotionHeaders), { Authorization: `Bearer ${this.secret}` }),
                    data: {
                        page_size: 1,
                    },
                });
                return true;
            }
            catch (error) {
                return false;
            }
        });
        this.listNotionPages = (startCursor_1, ...args_1) => __awaiter(this, [startCursor_1, ...args_1], void 0, function* (startCursor, pageSize = 100) {
            try {
                const data = {
                    page_size: pageSize,
                    filter: {
                        value: 'page',
                        property: 'object',
                    },
                };
                if (startCursor) {
                    data.start_cursor = startCursor;
                }
                return axios_1.default.request({
                    method: constants_1.NotionEndpointMethods.SEARCH,
                    baseURL: constants_1.NotionBaseUrl,
                    url: constants_1.NotionEndpoints.SEARCH,
                    headers: Object.assign(Object.assign({}, constants_1.NotionHeaders), { Authorization: `Bearer ${this.secret}` }),
                    data,
                });
            }
            catch (error) {
                return {};
            }
        });
        this.listPageBlocks = (blockId, startCursor) => __awaiter(this, void 0, void 0, function* () {
            try {
                let url = constants_1.NotionEndpoints.BLOCK_DETAIL(blockId);
                if (startCursor) {
                    url = constants_1.NotionEndpoints.BLOCK_DETAIL_WITH_CURSOR(blockId, startCursor);
                }
                return axios_1.default.request({
                    method: constants_1.NotionEndpointMethods.BLOCK_DETAIL,
                    baseURL: constants_1.NotionBaseUrl,
                    url,
                    headers: Object.assign(Object.assign({}, constants_1.NotionHeaders), { Authorization: `Bearer ${this.secret}` }),
                });
            }
            catch (error) {
                return {};
            }
        });
        this.secret = secret;
    }
}
exports.NotionWrapper = NotionWrapper;
