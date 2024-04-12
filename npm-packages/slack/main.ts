import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { SlackBaseUrl, TSlackEndpoints, SlackHeaders, SlackRedisKey } from './constants';
import type {
    SlackChannelInfoResponse,
    SlackConversationHistoryRequestParams,
    SlackConversationHistoryResponse,
    SlackConversationListRequestParams,
    SlackConversationListResponse,
    SlackUserListRequestParams,
    SlackUserListResponse,
    SlackUserResponse,
} from './types';
import querystring from 'querystring';
import { type RedisClientType } from 'redis';

export class SlackWrapper {
    private readonly accessToken: string;

    private readonly cache: RedisClientType | null = null;

    constructor(secret: string, cache?: unknown) {
        this.accessToken = secret;

        if (cache) {
            this.cache = cache as RedisClientType;
        }
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.listConversations(null, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async listConversations(cursor: string | null, limit = 100): Promise<SlackConversationListResponse> {
        const data: SlackConversationListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: TSlackEndpoints.CONVERSATION_LIST,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: querystring.stringify(data as unknown as querystring.ParsedUrlQueryInput),
        });
        return response.data;
    }

    public async getConversationHistory(
        channel: string,
        cursor: string | null,
        limit = 100,
    ): Promise<SlackConversationHistoryResponse> {
        const data: SlackConversationHistoryRequestParams = { limit, channel };

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: TSlackEndpoints.CONVERSATION_HISTORY,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: querystring.stringify(data as unknown as querystring.ParsedUrlQueryInput),
        });
        return response.data;
    }

    public async listUsers(cursor?: string, limit = 100): Promise<SlackUserListResponse> {
        const data: SlackUserListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: TSlackEndpoints.USERS_LIST,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: querystring.stringify(data as unknown as querystring.ParsedUrlQueryInput),
        });
        return response.data;
    }

    public async getUserInfoById(userId: string): Promise<SlackUserResponse> {
        if (this.cacheClientReady) {
            const cachedUser = await this.cache!.get(SlackRedisKey.USER(userId));

            if (cachedUser) {
                this.setRedis(SlackRedisKey.USER(userId), cachedUser);
                return JSON.parse(cachedUser);
            }
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: TSlackEndpoints.USER_INFO,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: querystring.stringify({ user: userId }),
        });

        const userData = response.data.user;
        this.setRedis(SlackRedisKey.USER(userId), JSON.stringify(userData));

        return userData;
    }

    public async getChannelInfoById(channelId: string): Promise<SlackChannelInfoResponse> {
        if (this.cacheClientReady) {
            const cachedChannel = await this.cache!.get(SlackRedisKey.CHANNEL(channelId));

            if (cachedChannel) {
                this.setRedis(SlackRedisKey.CHANNEL(channelId), cachedChannel);
                return JSON.parse(cachedChannel);
            }
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: TSlackEndpoints.CONVERSATION_INFO,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: querystring.stringify({ channel: channelId }),
        });

        const channelData = response.data.user;
        this.setRedis(SlackRedisKey.CHANNEL(channelId), JSON.stringify(channelData));
        
        return channelData;
    }

    /**
     * Slack rate limit allows ~1 req/sec per api method per account.
     * https://api.slack.com/apis/rate-limits
     *
     * Applies a one second delay
     */
    private async sendHttpRequest(req: AxiosRequestConfig, delayMs = 1000): Promise<AxiosResponse> {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, delayMs);
        });
        return axios.request(req);
    }

    private setRedis(key: string, value: string) {
        if (this.cacheClientReady) {
            this.cache!.set(key, value, { EX: 259200 }); // 72 hr expiration
        }
    }

    private get cacheClientReady() {
        return !!this.cache && this.cache.isOpen && this.cache.isReady;
    }
}
