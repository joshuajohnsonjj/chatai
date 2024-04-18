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
const querystring_1 = __importDefault(require("querystring"));
class SlackWrapper {
    constructor(secret, cache) {
        this.cache = null;
        this.accessToken = secret;
        if (cache) {
            this.cache = cache;
        }
    }
    testConnection(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [conversationResponse, userResponse, appResponse] = yield Promise.all([
                this.listConversations(null, 1),
                this.listUsers(null, 1),
                this.getAppActivity(appId, null, 1),
            ]);
            return {
                token: this.checkTokenValidity(conversationResponse, userResponse, appResponse),
                appId: this.checkAppIdValidity(appResponse),
            };
        });
    }
    listConversations(cursor_1) {
        return __awaiter(this, arguments, void 0, function* (cursor, limit = 100) {
            const data = { limit };
            if (cursor) {
                data.cursor = cursor;
            }
            const response = yield this.sendHttpRequest({
                method: 'get',
                baseURL: constants_1.SlackBaseUrl,
                url: constants_1.SlackEndpoints.CONVERSATION_LIST,
                headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                data: querystring_1.default.stringify(data),
            });
            return response.data;
        });
    }
    getConversationHistory(channel_1, cursor_1) {
        return __awaiter(this, arguments, void 0, function* (channel, cursor, limit = 100) {
            const data = { limit, channel };
            if (cursor) {
                data.cursor = cursor;
            }
            const response = yield this.sendHttpRequest({
                method: 'get',
                baseURL: constants_1.SlackBaseUrl,
                url: constants_1.SlackEndpoints.CONVERSATION_HISTORY,
                headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                data: querystring_1.default.stringify(data),
            });
            return response.data;
        });
    }
    getAppActivity(app_id, cursor, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { app_id, limit };
            if (cursor) {
                data.cursor = cursor;
            }
            const response = yield this.sendHttpRequest({
                method: 'get',
                baseURL: constants_1.SlackBaseUrl,
                url: constants_1.SlackEndpoints.APP_ACTIVITY_LIST,
                headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                data: querystring_1.default.stringify(data),
            });
            return response.data;
        });
    }
    listUsers(cursor_1) {
        return __awaiter(this, arguments, void 0, function* (cursor, limit = 100) {
            const data = { limit };
            if (cursor) {
                data.cursor = cursor;
            }
            const response = yield this.sendHttpRequest({
                method: 'get',
                baseURL: constants_1.SlackBaseUrl,
                url: constants_1.SlackEndpoints.USERS_LIST,
                headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                data: querystring_1.default.stringify(data),
            });
            return response.data;
        });
    }
    getUserInfoById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cacheClientReady) {
                const cachedUser = yield this.cache.get(constants_1.SlackRedisKey.USER(userId));
                if (cachedUser) {
                    this.setRedis(constants_1.SlackRedisKey.USER(userId), cachedUser);
                    return JSON.parse(cachedUser);
                }
            }
            const response = yield this.sendHttpRequest({
                method: 'get',
                baseURL: constants_1.SlackBaseUrl,
                url: constants_1.SlackEndpoints.USER_INFO,
                headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                data: querystring_1.default.stringify({ user: userId }),
            });
            const userData = response.data.user;
            this.setRedis(constants_1.SlackRedisKey.USER(userId), JSON.stringify(userData));
            return userData;
        });
    }
    getChannelInfoById(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cacheClientReady) {
                const cachedChannel = yield this.cache.get(constants_1.SlackRedisKey.CHANNEL(channelId));
                if (cachedChannel) {
                    this.setRedis(constants_1.SlackRedisKey.CHANNEL(channelId), cachedChannel);
                    return JSON.parse(cachedChannel);
                }
            }
            const response = yield this.sendHttpRequest({
                method: 'get',
                baseURL: constants_1.SlackBaseUrl,
                url: constants_1.SlackEndpoints.CONVERSATION_INFO,
                headers: Object.assign(Object.assign({}, constants_1.SlackHeaders), { Authorization: `Bearer ${this.accessToken}` }),
                data: querystring_1.default.stringify({ channel: channelId }),
            });
            const channelData = response.data.user;
            this.setRedis(constants_1.SlackRedisKey.CHANNEL(channelId), JSON.stringify(channelData));
            return channelData;
        });
    }
    /**
     * Slack rate limit allows ~1 req/sec per api method per account.
     * https://api.slack.com/apis/rate-limits
     *
     * Applies a one second delay
     */
    sendHttpRequest(req_1) {
        return __awaiter(this, arguments, void 0, function* (req, delayMs = 1000) {
            yield new Promise((resolve) => {
                setTimeout(resolve, delayMs);
            });
            return axios_1.default.request(req);
        });
    }
    setRedis(key, value) {
        if (this.cacheClientReady) {
            this.cache.set(key, value, { EX: 259200 }); // 72 hr expiration
        }
    }
    checkTokenValidity(conversationResponse, userResponse, appResponse) {
        return (conversationResponse.ok &&
            userResponse.ok &&
            (appResponse.ok || appResponse.error !== constants_1.SlackErros.ACCESS_DENIED));
    }
    checkAppIdValidity(appResponse) {
        return appResponse.error !== constants_1.SlackErros.INVALID_APP && appResponse.error !== constants_1.SlackErros.INVALID_APP_ID;
    }
    get cacheClientReady() {
        return !!this.cache && this.cache.isOpen && this.cache.isReady;
    }
}
exports.SlackWrapper = SlackWrapper;
