import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { GetThreadQueryParams, GetThreadResponse, ListThreadsQueryParams, ListThreadsResponse } from './types';
import { GmailEndpoints, GmailMessageResponseFormat } from './constants';
import { dateToGmailMinDateFilter } from './utility';
import { refreshGoogleOAuthToken } from '../../internalAPI';

const MAX_TRIES = 3;

export class GmailService {
    public static readonly DataSourceTypeName = 'GMAIL';

    private static readonly GmailBaseUrl = 'https://gmail.googleapis.com/gmail/v1/users';

    private accessToken: string;

    private readonly refreshToken?: string;

    constructor(accessToken: string, refreshToken?: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.listThreads(new Date(), undefined, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async listThreads(minDate?: Date, pageToken?: string, maxResults = 250): Promise<ListThreadsResponse> {
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
            url: `${GmailEndpoints.LIST_THREADS}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    public async getThread(threadId: string): Promise<GetThreadResponse> {
        const params: GetThreadQueryParams = {
            format: GmailMessageResponseFormat.FULL,
        };

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GmailService.GmailBaseUrl,
            url: `${GmailEndpoints.GET_THREAD.replace(':threadId', threadId)}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    /**
     * Gmail rate limit allows 25 req/sec.
     * https://developers.google.com/gmail/api/reference/quota
     *
     * This wrapper around the axios request adds a 50 ms pause
     * before making gmail request to avoid 429s
     */
    private sendHttpRequest = async (req: AxiosRequestConfig, attempt = 0): Promise<AxiosResponse> => {
        try {
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 50);
            });
            return await axios.request(req);
        } catch (e) {
            const code = (e as any).response.data.error.code;
            if (code === 401 && this.refreshToken && attempt < MAX_TRIES) {
                const newAccessToke = await refreshGoogleOAuthToken(this.refreshToken);
                this.accessToken = newAccessToke;
                const updatedReq = {
                    ...req,
                    headers: { Authorization: `Bearer ${newAccessToke}` },
                };
                return await this.sendHttpRequest(updatedReq, MAX_TRIES);
            }
            throw e;
        }
    };
}
