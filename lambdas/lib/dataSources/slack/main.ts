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

export class SlackService {
    public static readonly DataSourceTypeName = 'SLACK';

    private readonly accessToken: string;

    constructor(secret: string) {
        this.accessToken = secret;
    }

    public async testConnection(appId: string): Promise<{ token: boolean; appId: boolean }> {
        const [conversationResponse, userResponse, appResponse] = await Promise.all([
            this.listConversations(undefined, 1),
            this.listUsers(undefined, 1),
            this.getAppActivity(appId, 1),
        ]);

        return {
            token: this.checkTokenValidity(conversationResponse, userResponse, appResponse),
            appId: this.checkAppIdValidity(appResponse),
        };
    }

    public async listConversations(cursor?: string, limit = 100): Promise<SlackConversationListResponse> {
        const data: SlackConversationListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const query = new URLSearchParams(data as Record<string, string>).toString();

        const response = await this.sendHttpRequest(
            {
                method: 'get',
                baseURL: SlackBaseUrl,
                url: `${SlackEndpoints.CONVERSATION_LIST}?${query}`,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
            SlackEndpoints.CONVERSATION_LIST,
        );
        return response.data;
    }

    // TODO: test methods/ json vs url encoded

    public async getConversationHistory(
        channel: string,
        lowerDateBound?: string,
        cursor?: string,
        limit = 100,
    ): Promise<SlackConversationHistoryResponse> {
        const data: SlackConversationHistoryRequestParams = { limit, channel };

        if (lowerDateBound) {
            data.oldest = new Date(lowerDateBound).getTime();
        }

        if (cursor) {
            data.cursor = cursor;
        }

        const response = await this.sendHttpRequest(
            {
                method: 'post',
                baseURL: SlackBaseUrl,
                url: SlackEndpoints.CONVERSATION_HISTORY,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
                data,
            },
            SlackEndpoints.CONVERSATION_HISTORY,
        );
        return response.data;
    }

    public async getAppActivity(appId: string, limit: number, cursor?: string): Promise<SlackAppActivityResponse> {
        const data: SlackAppActivityListRequestParams = { app_id: appId, limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const query = new URLSearchParams(data as unknown as Record<string, string>).toString();

        const response = await this.sendHttpRequest(
            {
                method: 'get',
                baseURL: SlackBaseUrl,
                url: `${SlackEndpoints.APP_ACTIVITY_LIST}?${query}`,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
            SlackEndpoints.APP_ACTIVITY_LIST,
        );
        return response.data;
    }

    public async listUsers(cursor?: string, limit = 100): Promise<SlackUserListResponse> {
        const data: SlackUserListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        const query = new URLSearchParams(data as unknown as Record<string, string>).toString();

        const response = await this.sendHttpRequest(
            {
                method: 'get',
                baseURL: SlackBaseUrl,
                url: `${SlackEndpoints.USERS_LIST}?${query}`,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
            SlackEndpoints.USERS_LIST,
        );
        return response.data;
    }

    public async getUserInfoById(userId: string): Promise<SlackUserResponse> {
        const response = await this.sendHttpRequest(
            {
                method: 'get',
                baseURL: SlackBaseUrl,
                url: `${SlackEndpoints.USER_INFO}?${new URLSearchParams({ user: userId }).toString()}`,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
            SlackEndpoints.USER_INFO,
        );

        const userData = response.data.user;

        return userData;
    }

    public async getChannelInfoById(channelId: string): Promise<SlackChannelInfoResponse> {
        const response = await this.sendHttpRequest(
            {
                method: 'get',
                baseURL: SlackBaseUrl,
                url: `${SlackEndpoints.CONVERSATION_INFO}?${new URLSearchParams({ channel: channelId }).toString()}`,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
            SlackEndpoints.CONVERSATION_INFO,
        );

        const channelData = response.data.user;

        return channelData;
    }

    public async getMessageLink(channelId: string, messageTs: string): Promise<string> {
        const query = new URLSearchParams({ channel: channelId, message_ts: messageTs }).toString();

        const response = await this.sendHttpRequest(
            {
                method: 'get',
                baseURL: SlackBaseUrl,
                url: `${SlackEndpoints.MESSAGE_LINK}?${query}`,
                headers: {
                    ...SlackHeaders,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            },
            SlackEndpoints.MESSAGE_LINK,
        );

        return response.data.permalink;
    }

    /**
     * Slack rate limit allows ~1 req/sec per api method per account.
     * https://api.slack.com/apis/rate-limits
     *
     * Applies a one second delay
     */
    private async sendHttpRequest(req: AxiosRequestConfig, endpoint: SlackEndpoints): Promise<AxiosResponse> {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, this.rateLimitDelayByTier(endpoint));
        });
        return axios.request(req);
    }

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

    /**
     * https://api.slack.com/apis/rate-limits
     *
     * Tier 1 => 1/min
     * Tier 2 => 20/min
     * Tier 3 => 50/min
     * Tier 4 => 100/min
     * Special => see method docs
     */
    private rateLimitDelayByTier(endpoint: SlackEndpoints): number {
        switch (endpoint) {
            case SlackEndpoints.MESSAGE_LINK:
                return 200;

            // Tier 4
            case SlackEndpoints.USER_INFO:
                return 600;

            // Tier 3
            case SlackEndpoints.CONVERSATION_HISTORY:
            case SlackEndpoints.APP_ACTIVITY_LIST:
            case SlackEndpoints.CONVERSATION_INFO:
                return 1200;

            // Tier 2
            case SlackEndpoints.CONVERSATION_LIST:
            case SlackEndpoints.USERS_LIST:
                return 3000;
        }
    }
}
