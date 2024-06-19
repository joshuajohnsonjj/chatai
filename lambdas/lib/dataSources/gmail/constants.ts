export enum GmailEndpoints {
    LIST_THREADS = '/me/threads',
    GET_THREAD = '/me/threads/:threadId',
}

export enum GmailMessageResponseFormat {
    FULL = 'full',
    METADATA = 'metadata',
    MINIMAL = 'minimal',
}

export enum MimeType {
    TEXT = 'text/plain',
    MULTI = 'multipart/alternative',
    HTML = 'text/html',
}
