import axios from 'axios';
import { SlackBaseUrl, TSlackEndpoints, SlackHeaders } from './constants';
import {
    SlackConversationHistoryRequestParams,
    SlackConversationHistoryResponse,
    SlackConversationListRequestParams,
    SlackConversationListResponse,
    SlackUserListRequestParams,
    SlackUserListResponse,
} from './types';
import querystring from 'querystring';

export class SlackWrapper {
    private readonly accessToken: string;

    constructor(secret: string) {
        this.accessToken = secret;
    }

    public testConnection = async (): Promise<boolean> => {
        try {
            await this.requestDelay();
            await this.listConversations(null, 1);
            return true;
        } catch (error) {
            return false;
        }
    };

    public listConversations = async (cursor: string | null, limit = 100): Promise<SlackConversationListResponse> => {
        const data: SlackConversationListRequestParams = { limit };

        if (cursor) {
            data.cursor = cursor;
        }

        await this.requestDelay();
        const response = await axios.request({
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
    };

    public getConversationHistory = async (
        channel: string,
        cursor: string | null,
        limit = 100,
    ): Promise<SlackConversationHistoryResponse> => {
        const data: SlackConversationHistoryRequestParams = { limit, channel };

        if (cursor) {
            data.cursor = cursor;
        }

        await this.requestDelay();
        const response = await axios.request({
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
    };

    public listUsers = async (cursor?: string, limit = 100): Promise<SlackUserListResponse> => {
        const data: SlackUserListRequestParams = { limit, cursor };
        await this.requestDelay();
        const response = await axios.request({
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
    };

    /**
     * Slack rate limit allows ~1 req/sec per api method per account.
     * https://api.slack.com/apis/rate-limits
     *
     * Applies a one second delay
     */
    private requestDelay = async (): Promise<void> => {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 1000);
        });
    };
}
