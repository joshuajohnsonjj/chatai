export enum SlackChannelType {
    PUBLIC = 'public_channel',
    PRIVATE = 'private_channel',
    MULTI_DM = 'mpim',
    DM = 'im',
}

export interface SlackConversationListRequestParams {
    team_id?: string;
    types?: string; // comma seperated list of SlackChannelType
    limit?: number;
    cursor?: string;
    exclude_archived?: boolean;
}

export interface SlackConversationListResponse {
    ok: boolean;
    channels: SlackChannelInfoResponse[];
    response_metadata: {
        next_cursor: string;
    };
}

export interface SlackChannelInfoResponse {
    id: string;
    name: string;
    topic: {
        value: string;
    };
    // skiping irrelevant keys...
}

export interface SlackUserListRequestParams {
    limit?: number;
    cursor?: string;
}

export interface SlackUserListResponse {
    ok: boolean;
    members: SlackUserResponse[];
    response_metadata: {
        next_cursor: string;
    };
}

export interface SlackUserResponse {
    id: string;
    real_name: string;
    profile: {
        email: string;
    };
    // some keys skipped
}

export interface SimplifiedSlackUser {
    id: string;
    name: string;
    email: string | null;
}

export interface SlackConversationHistoryRequestParams {
    limit?: number;
    cursor?: string;
    include_all_metadata?: boolean;
    channel: string;
}

export interface SlackMessage {
    type: string;
    user: string;
    text: string;
    ts: string;
}

export interface SlackConversationHistoryResponse {
    ok: boolean;
    messages: SlackMessage[];
    has_more: boolean;
    response_metadata: {
        next_cursor: string;
    };
}

export interface SlackEventAPIPayload {
    type: 'event_callback';
    token: string;
    team_id: string;
    api_app_id: string;
    event: SlackMessageEventAPI
    event_id: string;
    event_time: number;
}

export interface SlackMessageEventAPI {
    type: 'message';
    channel: string; // channel id
	user: string; // user id
	text: string;
	ts: string;
    edited?: {
        user: string;
        ts: string;
    };
}
