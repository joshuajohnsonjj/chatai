// https://developers.google.com/meet/api/reference/rest/v2

import { TranscriptState } from './constants';

export interface QueryParams {
    pageSize?: number;
    pageToken?: string;
}

export interface ListConferenceRecordsQueryParams extends QueryParams {
    // Filters info: https://developers.google.com/meet/api/reference/rest/v2/conferenceRecords/list#query-parameters
    filter?: string;
}

export interface ConferenceRecord {
    name: string;
    startTime: string;
    endTime: string;
    expireTime: string;
    space: string;
}

export interface ListConferenceRecordsResponse {
    conferenceRecords: (Omit<ConferenceRecord, 'name'> & { id: string })[];
    nextPageToken: string;
}

export interface Transcript {
    name: string;
    state: TranscriptState;
    startTime: string;
    endTime: string;
    docsDestination: {
        document: string;
        exportUri: string;
    };
}

export interface ListTranscriptsResponse {
    transcripts: (Omit<Transcript, 'name'> & { id: string })[];
    nextPageToken: string;
}

export interface TranscriptEntry {
    name: string;
    participant: string;
    text: string;
    languageCode: string; // i.e. "en-US". IETF BCP 47 syntax (https://tools.ietf.org/html/bcp47)
    startTime: string;
    endTime: string;
}

export interface ListTranscriptEntriesResponse {
    transcriptEntries: (Omit<TranscriptEntry, 'name'> & { id: string })[];
    nextPageToken: string;
}

export interface GoogleMeetSQSMessageBody {
    conferenceId: string;
    ownerEntityId: string;
    secret: string;
    refreshToken: string;
    dataSourceId: string;
    isFinal: boolean;
}
