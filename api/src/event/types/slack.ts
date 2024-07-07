export enum EventType {
    EVENT = 'event_callback',
    VERIFICATION = 'url_verification',
    RATE_LIMIT = 'app_rate_limited',
}

export interface SlackEventAPIPayload {
    type: EventType;
    token: string;
    team_id: string;
    api_app_id: string;
    event: SlackMessageEventAPI | SlackMessageChangeEventAPI | SlackMessageDeleteEventAPI | SlackMessageReplyEventAPI;
    authorizations: unknown;
    event_id: string;
    event_time: number;
    event_context: string;
}

export enum MessageEventType {
    MESSAGE = 'message',
    CHANGE = 'message_changed',
    DELETE = 'message_deleted',
    REPLY = 'message_replied',
}

export const ImportableMessageEventTypes = [MessageEventType.CHANGE, MessageEventType.DELETE, MessageEventType.REPLY];

export interface SlackMessageEventAPI {
    type: 'message' | string;
    channel: string; // channel id
    user: string; // user id
    text: string;
    ts: string;
    edited?: {
        user: string;
        ts: string;
    };
}

export interface SlackMessageChangeEventAPI {
    type: 'message' | string;
    subtype: MessageEventType.CHANGE;
    channel: string;
    ts: string;
    message: SlackMessageEventAPI;
}

export interface SlackMessageDeleteEventAPI {
    type: 'message' | string;
    subtype: MessageEventType.DELETE;
    channel: string;
    ts: string;
    deleted_ts: string;
}

// FIXME: bug alert? https://api.slack.com/events/message/message_replied
export interface SlackMessageReplyEventAPI {
    type: 'message' | string;
    subtype: MessageEventType.REPLY;
    message: {
        type: 'message';
        user: string;
        text: string;
        thread_ts: string;
        reply_count: number;
        replies: [
            {
                user: string;
                ts: string;
            },
        ];
        ts: string;
        edited?: {
            user: string;
            ts: string;
        };
    };
    channel: string;
    event_ts: string;
    ts: string;
}
