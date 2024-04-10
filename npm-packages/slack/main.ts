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
            await this.listConversations(undefined, 1);
            return true;
        } catch (error) {
            return false;
        }
    };

    public listConversations = async (cursor?: string, limit = 100): Promise<SlackConversationListResponse> => {
        const data: SlackConversationListRequestParams = { limit, cursor };
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
        cursor?: string,
        limit = 100,
    ): Promise<SlackConversationHistoryResponse> => {
        const data: SlackConversationHistoryRequestParams = { limit, cursor, channel };
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
}
