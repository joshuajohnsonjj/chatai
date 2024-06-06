import { GmailMessageResponseFormat } from './constants';

export interface GmailSQSMessageBody {
    threadId: string;
    ownerEntityId: string;
    secret: string;
    refreshToken: string;
    dataSourceId: string;
    userId: string;
    isFinal: boolean;
}

export interface ListThreadsQueryParams {
    maxResults: number;
    pageToken?: string;
    q?: string;
    includeSpamTrash: boolean;
}

export interface ListThreadsResponse {
    threads: {
        id: string;
        snippet: string;
        historyId: string;
    }[];
    nextPageToken: string;
    resultSizeEstimate: number; // num results returned
}

export interface GetThreadQueryParams {
    format: GmailMessageResponseFormat;
}

export interface GetThreadResponse {
    id: string;
    snippet: string;
    historyId: string;
    messages: {
        id: string;
        threadId: string;
        snippet: string;
        historyId: string;
        internalDate: string;
        payload: {
            parts: {
                partId: string;
                mimeType: string;
                filename: string;
                headers: {
                    name: string; // From, To, Subject available here
                    value: string;
                }[];
                body: {
                    attachmentId: string;
                    size: number;
                    data: string;
                };
            }[];
        };
        sizeEstimate: number;
        raw: string;
    }[];
}
