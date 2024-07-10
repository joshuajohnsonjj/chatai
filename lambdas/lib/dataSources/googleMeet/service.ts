import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { refreshGoogleOAuthToken } from '../../internalAPI';
import type {
    ConferenceRecord,
    ListConferenceRecordsQueryParams,
    ListConferenceRecordsResponse,
    ListTranscriptEntriesResponse,
    ListTranscriptsResponse,
    QueryParams,
    Transcript,
    TranscriptEntry,
} from './types';
import { Endpoints } from './constants';

const MAX_TRIES = 3;

export class GoogleMeetService {
    public static readonly DataSourceTypeName = 'GOOGLE_MEET';

    private static readonly ConferenceRecordsBaseUrl = 'https://meet.googleapis.com/v2/conferenceRecords';

    private accessToken: string;

    private readonly refreshToken?: string;

    constructor(accessToken: string, refreshToken?: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.listConferenceRecords(new Date(), undefined, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async listConferenceRecords(
        lowerDateBound?: Date,
        pageToken?: string,
        pageSize = 100,
    ): Promise<ListConferenceRecordsResponse> {
        const params: ListConferenceRecordsQueryParams = {
            pageSize: pageSize,
            pageToken,
            filter: lowerDateBound ? this.dateToLowerDateBoundFilter(lowerDateBound) : undefined,
        };

        const query = new URLSearchParams(params as unknown as Record<string, string>);
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleMeetService.ConferenceRecordsBaseUrl,
            url: `?${query.toString()}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        const nameDelimiter = 'conferenceRecords/';

        return {
            conferenceRecords: response.data.conferenceRecords.map((record: ConferenceRecord) => ({
                ...record,
                id: record.name.slice(record.name.indexOf(nameDelimiter) + nameDelimiter.length),
            })),
            nextPageToken: response.data.nextPageToken,
        };
    }

    public async listTranscripts(conferenceId: string, pageToken?: string): Promise<ListTranscriptsResponse> {
        const params: QueryParams = {
            pageSize: 100,
            pageToken,
        };

        const query = new URLSearchParams(params as unknown as Record<string, string>);
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleMeetService.ConferenceRecordsBaseUrl,
            url: `${Endpoints.TRANSCRIPTS.replace(':conferenceId', conferenceId)}?${query.toString()}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        const nameDelimiter = 'transcripts/';

        return {
            transcripts: response.data.transcripts.map((record: Transcript) => ({
                ...record,
                id: record.name.slice(record.name.indexOf(nameDelimiter) + nameDelimiter.length),
            })),
            nextPageToken: response.data.nextPageToken,
        };
    }

    public async listTranscriptEntries(
        conferenceId: string,
        transcriptId: string,
        pageToken?: string,
    ): Promise<ListTranscriptEntriesResponse> {
        const params: QueryParams = {
            pageSize: 100,
            pageToken,
        };

        const query = new URLSearchParams(params as unknown as Record<string, string>);
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleMeetService.ConferenceRecordsBaseUrl,
            url: `${Endpoints.TRANSCRIPT_ENTRIES.replace(':conferenceId', conferenceId).replace(':transcriptId', transcriptId)}?${query.toString()}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        const nameDelimiter = 'entries/';

        return {
            transcriptEntries: response.data.transcriptEntries.map((record: TranscriptEntry) => ({
                ...record,
                id: record.name.slice(record.name.indexOf(nameDelimiter) + nameDelimiter.length),
            })),
            nextPageToken: response.data.nextPageToken,
        };
    }

    /**
     * Google Drive rate limit allows 100 req/sec.
     * https://developers.google.com/meet/api/guides/limits
     */
    private sendHttpRequest = async (req: AxiosRequestConfig, attempt = 0): Promise<AxiosResponse> => {
        try {
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 11);
            });
            return await axios.request(req);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const code = (e as any).response.data.error.code;
            if (code === 401 && this.refreshToken && attempt < MAX_TRIES) {
                const newAccessToken = await refreshGoogleOAuthToken(this.refreshToken);
                this.accessToken = newAccessToken;
                const updatedReq = {
                    ...req,
                    headers: { Authorization: `Bearer ${newAccessToken}` },
                };
                return await this.sendHttpRequest(updatedReq, MAX_TRIES);
            }
            throw e;
        }
    };

    private dateToLowerDateBoundFilter(date: Date): string {
        return `start_time>="${date.toISOString()}"`;
    }
}
