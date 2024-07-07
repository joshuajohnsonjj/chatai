import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { NotionBaseUrl, NotionEndpointMethods, NotionEndpoints, NotionHeaders } from './constants';
import {
    NotionSearchPayload,
    NotionSearchResponse,
    NotionUserDetailResponse,
    NotionBlockDetailResponse,
} from './types';

export class NotionService {
    public static readonly DataSourceTypeName = 'NOTION';

    private readonly secret: string;

    constructor(secret: string) {
        this.secret = secret;
    }

    public testConnection = async (): Promise<boolean> => {
        try {
            await this.sendHttpRequest({
                method: 'post',
                baseURL: NotionBaseUrl,
                url: NotionEndpoints.SEARCH,
                headers: {
                    ...NotionHeaders,
                    Authorization: `Bearer ${this.secret}`,
                },
                data: {
                    page_size: 1,
                } as NotionSearchPayload,
            });
            return true;
        } catch (error) {
            return false;
        }
    };

    public listPages = async (startCursor: string | null, pageSize = 100): Promise<NotionSearchResponse> => {
        const data: NotionSearchPayload = {
            page_size: pageSize,
            filter: {
                value: 'page',
                property: 'object',
            },
            sort: {
                direction: 'descending',
                timestamp: 'last_edited_time',
            },
        };

        if (startCursor) {
            data.start_cursor = startCursor;
        }

        const resp = await this.sendHttpRequest({
            method: 'post',
            baseURL: NotionBaseUrl,
            url: NotionEndpoints.SEARCH,
            headers: {
                ...NotionHeaders,
                Authorization: `Bearer ${this.secret}`,
            },
            data,
        });
        return resp.data;
    };

    public listPageBlocks = async (blockId: string, startCursor: string | null): Promise<NotionBlockDetailResponse> => {
        let url = NotionEndpoints.BLOCK_DETAIL(blockId);

        if (startCursor) {
            url = NotionEndpoints.BLOCK_DETAIL_WITH_CURSOR(blockId, startCursor);
        }

        const resp = await this.sendHttpRequest({
            method: NotionEndpointMethods.BLOCK_DETAIL,
            baseURL: NotionBaseUrl,
            url,
            headers: {
                ...NotionHeaders,
                Authorization: `Bearer ${this.secret}`,
            },
        });
        return resp.data;
    };

    public getUserInfo = async (userId: string): Promise<NotionUserDetailResponse> => {
        const resp = await this.sendHttpRequest({
            method: 'get',
            baseURL: NotionBaseUrl,
            url: NotionEndpoints.USER_DETAIL(userId),
            headers: {
                ...NotionHeaders,
                Authorization: `Bearer ${this.secret}`,
            },
        });
        return resp.data;
    };

    /**
     * Notion rate limit allows ~3 req/sec per account.
     * https://developers.notion.com/reference/request-limits
     *
     * This wrapper around the axios request applies a 0.334
     * second delay before every request to avoid 429's
     */
    private sendHttpRequest = async (req: AxiosRequestConfig): Promise<AxiosResponse> => {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 334);
        });
        return axios.request(req);
    };
}
