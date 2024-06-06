import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { GetThreadQueryParams, GetThreadResponse, ListThreadsQueryParams, ListThreadsResponse } from './types';
import { GmailEndpoints, GmailMessageResponseFormat } from './constants';
import { dateToGmailMinDateFilter } from './utility';

const MAX_TRIES = 3;

export class GmailService {
    private static readonly GmailBaseUrl = 'https://gmail.googleapis.com/gmail/v1/users';

    private accessToken: string;

    private readonly refreshToken?: string;

    constructor(accessToken: string, refreshToken?: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public async testConnection(email: string): Promise<boolean> {
        try {
            await this.listThreads(email, new Date(), undefined, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async listThreads(
        email: string,
        minDate?: Date,
        pageToken?: string,
        maxResults = 250,
    ): Promise<ListThreadsResponse> {
        const params: ListThreadsQueryParams = {
            maxResults,
            includeSpamTrash: false,
        };

        if (pageToken) {
            params.pageToken = pageToken;
        }

        if (minDate) {
            params.q = dateToGmailMinDateFilter(minDate);
        }

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GmailService.GmailBaseUrl,
            url: `${GmailEndpoints.LIST_THREADS.replace(':email', email)}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    public async getThread(email: string, threadId: string): Promise<GetThreadResponse> {
        const params: GetThreadQueryParams = {
            format: GmailMessageResponseFormat.FULL,
        };

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GmailService.GmailBaseUrl,
            url: `${GmailEndpoints.GET_THREAD.replace(':email', email).replace(':threadId', threadId)}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    /**
     * Google Drive rate limit allows 12 req/sec.
     * https://developers.google.com/gmail/api/reference/quota
     *
     * This wrapper around the axios request implements up to 3 retries
     * with exponential backoff if 403 or 429 error received
     */
    private sendHttpRequest = async (req: AxiosRequestConfig, attempt = 0): Promise<AxiosResponse> => {
        try {
            return await axios.request(req);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            const code = e.response.data.error.code;
            if (attempt + 1 < MAX_TRIES && (code === 403 || code === 429)) {
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 3 ** attempt);
                });
                return await this.sendHttpRequest(req);
            } else if (code === 401 && this.refreshToken) {
                const resp = await axios.request({
                    method: 'get',
                    baseURL: 'http://locahost:3001',
                    url: `/v1/auth/google/refresh?refreshToken=${this.refreshToken}`,
                });
                this.accessToken = resp.data.accessToken;
                await axios.request(req);
            }
            throw e;
        }
    };
}
