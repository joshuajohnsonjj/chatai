import { GmailMessageResponseFormat } from './constants';

export interface GmailSQSMessageBody {
    threadId: string;
    ownerEntityId: string;
    secret: string;
    refreshToken: string;
    dataSourceId: string;
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
    messages: GmailMessagePart[];
}

export interface GmailMessagePart {
    id: string;
    threadId: string;
    labelIds: string;
    snippet: string;
    sizeEstimate: number;
    historyId: string;
    internalDate: string;
    payload: {
        headers: {
            name: string; // From, To, Subject available here
            value: string;
        }[];
        parts: {
            partId: string;
            mimeType: string;
            filename: string;
            body: {
                attachmentId: string;
                size: number;
                data: string;
            };
        }[];
    };
}
