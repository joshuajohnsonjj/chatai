import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { DocsAPIEndpoints, DriveAPIEndpints } from './types';
import type {
    DriveException,
    DriveListFilesRequestParams,
    DriveListFilesResponse,
    GoogleDoc,
    StartDriveWatchResponse,
} from './types';
import { v4 } from 'uuid';
import { refreshGoogleOAuthToken } from '../../internalAPI';

const MAX_TRIES = 3;

export class GoogleDriveService {
    public static readonly DataSourceTypeName = 'GOOGLE_DRIVE';

    private static readonly DocsBaseUrl = 'https://docs.googleapis.com/v1';

    private static readonly DriveBaseUrl = 'https://www.googleapis.com/drive/v3';

    private accessToken: string;

    private readonly refreshToken?: string;

    constructor(accessToken: string, refreshToken?: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.listFiles(null, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async listFiles(pageToken?: string | null, pageSize = 50): Promise<DriveListFilesResponse> {
        const params: DriveListFilesRequestParams = {
            pageSize: pageSize.toString(),
            mimeType: 'application/vnd.google-apps.document',
            fields: '*',
        };

        if (pageToken) {
            params.pageToken = pageToken;
        }

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleDriveService.DriveBaseUrl,
            url: `${DriveAPIEndpints.LIST_FILES}?${query}`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        return response.data;
    }

    public async getFileContent(docId: string): Promise<GoogleDoc> {
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleDriveService.DocsBaseUrl,
            url: `${DocsAPIEndpoints.READ_DOCUMET.replace(':documentId', docId)}?suggestionsViewMode=PREVIEW_WITHOUT_SUGGESTIONS`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        return response.data;
    }

    public async initiateWebhookConnection(entityId: string, address: string): Promise<StartDriveWatchResponse> {
        const data = {
            id: v4(),
            type: 'web_hook',
            address,
            token: `entityId:${entityId}`,
            payload: true,
            kind: 'api#channel',
        };

        const response = await this.sendHttpRequest({
            method: 'post',
            baseURL: GoogleDriveService.DriveBaseUrl,
            url: `${DriveAPIEndpints.START_LISTENING}?includeRemoved=true`,
            data,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        return response.data;
    }

    /**
     * Only the original creator of the connection can destroy it (google api constraint)
     */
    public async killWebhookConnection(
        connectionId: string,
        resourceId: string,
    ): Promise<{ success: boolean; error?: DriveException }> {
        const data = {
            id: connectionId,
            resourceId,
        };

        await this.sendHttpRequest({
            method: 'post',
            baseURL: GoogleDriveService.DriveBaseUrl,
            url: DriveAPIEndpints.STOP_LISTENING,
            data,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });

        return { success: true };
    }

    /**
     * Google Drive rate limit allows 12000 req/min.
     * https://developers.google.com/drive/api/guides/limits
     *
     * This wrapper around the axios request implements up to 3 retries
     * with exponential backoff if 403 or 429 error received
     */
    private sendHttpRequest = async (req: AxiosRequestConfig, attempt = 0): Promise<AxiosResponse> => {
        try {
            return await axios.request(req);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
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
