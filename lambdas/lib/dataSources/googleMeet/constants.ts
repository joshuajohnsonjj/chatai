export enum Endpoints {
    TRANSCRIPTS = '/:conferenceId/transcripts',
    TRANSCRIPT_ENTRIES = '/:conferenceId/transcripts/:transcriptId/entries',
}

export enum TranscriptState {
    STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
    STARTED = 'STARTED',
    ENDED = 'ENDED',
    FILE_GENERATED = 'FILE_GENERATED',
}
