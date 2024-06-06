export enum GmailEndpoints {
    LIST_THREADS = '/:email/threads',
    GET_THREAD = '/:email/threads/:threadId',
}

export enum GmailMessageResponseFormat {
    FULL = 'full',
    METADATA = 'metadata',
    MINIMAL = 'minimal',
}
