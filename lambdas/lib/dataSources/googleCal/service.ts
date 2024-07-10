import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { refreshGoogleOAuthToken } from '../../internalAPI';
import type {
    CalDate,
    CalParticipant,
    ListCalQueryParams,
    ListCalResponse,
    ListEventsQueryParams,
    ListEventsResponse,
} from './types';
import { GoogleCalEndpoints } from './constants';
import moment from 'moment';

const MAX_TRIES = 3;

export class GoogleCalService {
    public static readonly DataSourceTypeName = 'GOOGLE_CALENDAR';

    private static readonly GoogleCalBaseUrl = 'https://www.googleapis.com/calendar/v3';

    private accessToken: string;

    private readonly refreshToken?: string;

    constructor(accessToken: string, refreshToken?: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.getCalList(undefined, 1);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async getCalList(pageToken?: string, maxResults = 250): Promise<ListCalResponse> {
        const params: ListCalQueryParams = {
            maxResults,
        };

        if (pageToken) {
            params.pageToken = pageToken;
        }

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleCalService.GoogleCalBaseUrl,
            url: `${GoogleCalEndpoints.CALENDAR_LIST}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    public async getCalEvents(
        calId: string,
        minUpdatedDate?: string,
        pageToken?: string,
        maxResults = 250,
    ): Promise<ListEventsResponse> {
        const params: ListEventsQueryParams = {
            maxResults,
            timeMin: moment().subtract(6, 'months').toISOString(),
            timeMax: moment().add(1, 'year').toISOString(),
        };

        if (pageToken) {
            params.pageToken = pageToken;
        }

        if (minUpdatedDate) {
            params.updatedMin = new Date(minUpdatedDate).toISOString();
        }

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleCalService.GoogleCalBaseUrl,
            url: `${GoogleCalEndpoints.EVENTS.replace(':calendarId', calId)}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    public async getEventByMeetingId(calId: string, meetingId: string): Promise<ListEventsResponse> {
        const params: ListEventsQueryParams = {
            q: meetingId,
            maxResults: 1,
        };

        const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
        const response = await this.sendHttpRequest({
            method: 'get',
            baseURL: GoogleCalService.GoogleCalBaseUrl,
            url: `${GoogleCalEndpoints.EVENTS.replace(':calendarId', calId)}?${query}`,
            headers: { Authorization: `Bearer ${this.accessToken}` },
        });

        return response.data;
    }

    public buildTextBodyFromEvent(
        title: string,
        description: string,
        creator: CalParticipant,
        participants: CalParticipant[],
        location: string,
        start: CalDate,
        end: CalDate,
    ): string {
        return `
            Google Calendar event: ${title}\n\n
            At ${location}, from ${new Date(start.dateTime).toUTCString()} to ${new Date(end.dateTime).toUTCString()}
            Event Description:\n${description}\n\n
            Created By: ${creator.displayName} (${creator.email})\n
            Participants:\n${participants.map((participant) => participant.displayName + ' (' + participant.email + ')').join('\n')}
        `;
    }

    /**
     * TODO: revisit quotas for all google apis, add exponential backoff retries if the set timeout fails...
     * google cal rate limit allows 10 req/sec.
     * https://console.cloud.google.com/apis/dashboard?project=gen-lang-client-0432872551
     *
     * This wrapper around the axios request adds a 150 ms pause
     * before making google cal request to avoid 429s
     */
    private sendHttpRequest = async (req: AxiosRequestConfig, attempt = 0): Promise<AxiosResponse> => {
        try {
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 150);
            });
            return await axios.request(req);
        } catch (e) {
            // eslint-disable-next-line
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
