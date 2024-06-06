import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { SlackBaseUrl, SlackEndpoints, SlackErros, SlackHeaders } from './constants';
import type {
    SlackAppActivityListRequestParams,
    SlackAppActivityResponse,
    SlackChannelInfoResponse,
    SlackConversationHistoryRequestParams,
    SlackConversationHistoryResponse,
    SlackConversationListRequestParams,
    SlackConversationListResponse,
    SlackUserListRequestParams,
    SlackUserListResponse,
    SlackUserResponse,
} from './types';

export class SlackWrapper {
    private readonly accessToken: string;


    constructor(secret: string) {
        this.accessToken = secret;
    }

    public async testConnection(appId: string): Promise<{ token: boolean; appId: boolean }> {
        const [conversationResponse, userResponse, appResponse] = await Promise.all([
            this.listConversations(null, 1),
            this.listUsers(null, 1),
            this.getAppActivity(appId, null, 1),
        ]);

        return {
            token: this.checkTokenValidity(conversationResponse, userResponse, appResponse),
            appId: this.checkAppIdValidity(appResponse),
        };
    }

    public async listConversations(cursor: string | null, limit = 100): Promise<SlackConversationListResponse> {
        const data: SlackConversationListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: SlackEndpoints.CONVERSATION_LIST,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: new URLSearchParams(data as Record<string, string>).toString(),
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
            url: SlackEndpoints.CONVERSATION_HISTORY,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: new URLSearchParams(data as unknown as Record<string, string>).toString(),
        });
        return response.data;
    }

    public async getAppActivity(
        app_id: string,
        cursor: string | null,
        limit: number,
    ): Promise<SlackAppActivityResponse> {
        const data: SlackAppActivityListRequestParams = { app_id, limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: SlackEndpoints.APP_ACTIVITY_LIST,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: new URLSearchParams(data as unknown as Record<string, string>).toString(),
        });
        return response.data;
    }

    public async listUsers(cursor: string | null, limit = 100): Promise<SlackUserListResponse> {
        const data: SlackUserListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: SlackEndpoints.USERS_LIST,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: new URLSearchParams(data as unknown as Record<string, string>).toString(),
        });
        return response.data;
    }

    public async getUserInfoById(userId: string): Promise<SlackUserResponse> {
        // if (this.cacheClientReady) {
        //     const cachedUser = await this.cache!.get(SlackRedisKey.USER(userId));

        //     if (cachedUser) {
        //         this.setRedis(SlackRedisKey.USER(userId), cachedUser);
        //         return JSON.parse(cachedUser);
        //     }
        // }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: SlackEndpoints.USER_INFO,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: new URLSearchParams({ user: userId }).toString(),
        });

        const userData = response.data.user;
        // this.setRedis(SlackRedisKey.USER(userId), JSON.stringify(userData));

        return userData;
    }

    public async getChannelInfoById(channelId: string): Promise<SlackChannelInfoResponse> {
        // if (this.cacheClientReady) {
        //     const cachedChannel = await this.cache!.get(SlackRedisKey.CHANNEL(channelId));

        //     if (cachedChannel) {
        //         this.setRedis(SlackRedisKey.CHANNEL(channelId), cachedChannel);
        //         return JSON.parse(cachedChannel);
        //     }
        // }

        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: SlackBaseUrl,
            url: SlackEndpoints.CONVERSATION_INFO,
            headers: {
                ...SlackHeaders,
                Authorization: `Bearer ${this.accessToken}`,
            },
            data: new URLSearchParams({ channel: channelId }).toString(),
        });

        const channelData = response.data.user;
        // this.setRedis(SlackRedisKey.CHANNEL(channelId), JSON.stringify(channelData));

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

    // private setRedis(key: string, value: string): void {
    //     if (this.cacheClientReady) {
    //         this.cache!.set(key, value, { EX: 259200 }); // 72 hr expiration
    //     }
    // }

    private checkTokenValidity(
        conversationResponse: SlackConversationListResponse,
        userResponse: SlackUserListResponse,
        appResponse: SlackAppActivityResponse,
    ): boolean {
        return (
            conversationResponse.ok &&
            userResponse.ok &&
            (appResponse.ok || appResponse.error !== SlackErros.ACCESS_DENIED)
        );
    }

    private checkAppIdValidity(appResponse: SlackAppActivityResponse): boolean {
        return appResponse.error !== SlackErros.INVALID_APP && appResponse.error !== SlackErros.INVALID_APP_ID;
    }

    // private get cacheClientReady(): boolean {
    //     return !!this.cache && this.cache.isOpen && this.cache.isReady;
    // }
}
