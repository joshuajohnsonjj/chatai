export enum DocsAPIEndpoints {
    READ_DOCUMET = '/documents/:documentId',
}

export enum DriveAPIEndpints {
    LIST_FILES = '/files',
    START_LISTENING = '/changes/watch',
    STOP_LISTENING = '/channels/stop',
}

export enum DriveException {
    WRONG_USER = 'WRONG_USER',
    AUTH = 'AUTH',
}

export interface DriveListFilesRequestParams {
    pageSize: string;
    pageToken?: string;
    mimeType: string;
    fields: string;
}

export interface DriveListFilesResponse {
    nextPageToken?: string;
    kind: 'drive#fileList';
    files: DriveFile[];
}

export interface DriveFile {
    kind: 'drive#file';
    parents: string[]; // array of file ids
    thumbnailLink: string;
    iconLink: string;
    lastModifyingUser: DriveUser;
    owners: DriveUser[];
    id: string;
    name: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string;
}

export interface DriveUser {
    kind: 'drive#user';
    displayName: string;
    photoLink: string;
    emailAddress: string;
}

export interface StartDriveWatchResponse {
    kind: 'api#channel';
    id: string;
    resourceId: string;
    resourceUri: string;
    token: string;
}

export interface GoogleDoc {
    documentId: string;
    title: string;
    body: {
        content: {
            startIndex: number;
            endIndex: number;
            paragraph: {
                elements: {
                    startIndex: number;
                    endIndex: number;
                    textRun: {
                        content: string;
                        textStyle: unknown;
                    };
                }[];
            };
            table: unknown; // TODO: figureout how to parse table
            sectionBreak: unknown;
            tableOfContents: unknown;
        }[];
    };
}

export interface GoogleDriveChangeEvent {
    kind: 'drive#change';
    removed: boolean;
    file: GoogleDoc;
    fileId: string;
    time: string;
    driveId: string;
    changeType: 'drive' | 'file';
    drive: unknown;
}

/**
 *
 * SQS types
 *
 */
export interface GoogleDriveSQSMessageBody {
    fileId: string;
    fileUrl: string;
    ownerEntityId: string;
    fileName: string;
    secret: string;
    refreshToken: string;
    dataSourceId: string;
    modifiedDate: string;
    userId: string;
    authorName?: string;
    authorEmail?: string;
    isFinal: string;
}
