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
exports.SlackWrapper = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
class SlackWrapper {
    constructor(secret) {
        this.testSlackConnection = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios_1.default.request({
                    method: 'post',
                    baseURL: constants_1.SlackBaseUrl,
                    url: constants_1.TSlackEndpoints.CONVERSATION_LIST,
                    headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                    data: {
                        limit: 1,
                    },
                });
                return true;
            }
            catch (error) {
                return false;
            }
        });
        this.accessToken = secret;
    }
}
exports.SlackWrapper = SlackWrapper;
