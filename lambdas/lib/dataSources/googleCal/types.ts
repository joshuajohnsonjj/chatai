export interface ListCalQueryParams {
    maxResults?: number;
    pageToken?: string;
    minAccessRole?: 'freeBusyReader' | 'owner' | 'reader' | 'writer';
}

export interface CalenderResource {
    kind: 'calendar#calendarListEntry';
    id: string;
    summary: string;
    description: string;
    location: string;
    timeZone: string;
}

export interface ListCalResponse {
    kind: 'calendar#calendarList';
    nextPageToken: string;
    nextSyncToken: string;
    items: CalenderResource[];
}

export interface ListEventsQueryParams {
    maxResults?: number;
    orderBy?: 'startTime' | 'updated';
    pageToken?: string;

    // RFC3339 timestamp with mandatory time zone offset, for example, 2011-06-03T10:00:00Z
    timeMin?: string;
    timeMax?: string;
    updatedMin?: string;
}

export interface CalParticipant {
    id: string;
    email: string;
    displayName: string;
}

export interface CalDate {
    date: string; // The date, in the format "yyyy-mm-dd", if this is an all-day event
    dateTime: string;
    timeZone: string;
}

export interface CalEvent {
    kind: 'calendar#event';
    id: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    htmlLink: string;
    created: string;
    updated: string;
    summary: string;
    description: string;
    location: string;
    creator: CalParticipant;
    start: CalDate;
    end: CalDate;
    endTimeUnspecified: boolean;
    recurrence: string[]; // TODO: understand this
    attendees: CalParticipant[];
    attachments: {
        fileUrl: string;
        title: string;
        mimeType: string;
        iconLink: string;
        fileId: string;
    }[];
    eventType: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation' | 'fromGmail';
}

export interface ListEventsResponse {
    kind: 'calendar#events';
    summary: string; // calendar title
    description: string; // calendar description
    updated: string;
    timeZone: string;
    accessRole: 'freeBusyReader' | 'owner' | 'reader' | 'writer';
    nextPageToken: string;
    nextSyncToken: string;
    items: CalEvent[];
}

/**
 *
 * SQS types
 *
 */
export interface GoogleCalSQSMessageBody {
    calId: string;
    ownerEntityId: string;
    secret: string;
    refreshToken: string;
    dataSourceId: string;
    lowerDateBound?: string;
    isFinal: string;
}
