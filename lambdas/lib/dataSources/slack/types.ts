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
    error?: string;
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

export interface SlackAppActivityListRequestParams {
    limit?: number;
    cursor?: string;
    app_id: string;
}

export interface SlackUserListResponse {
    ok: boolean;
    error?: string;
    members: SlackUserResponse[];
    response_metadata: {
        next_cursor: string;
    };
}

export interface SlackAppActivityResponse {
    ok: boolean;
    error?: string;
    activities: unknown[];
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
    oldest?: number;
    latest?: number;
    channel: string;
}

export interface SlackMessage {
    type: 'message';
    user: string;
    text: string;
    ts: string;
}

export interface SlackConversationHistoryResponse {
    ok: boolean;
    error?: string;
    messages: SlackMessage[];
    has_more: boolean;
    response_metadata: {
        next_cursor: string;
    };
}

export interface UserInfo {
    name: string;
    email: string;
}

/**
 *
 * SQS types
 *
 */
export interface SlackSQSMessageBody {
    channelId: string;
    channelName: string;
    ownerEntityId: string;
    secret: string;
    dataSourceId: string;
    lowerDateBound?: string;
    isFinal: boolean;
}

export interface SlackEventSQSMessageBody {
    ownerEntityId: string;
    secret: string;
    dataSourceId: string;
    isDeletion: boolean;
    channelId: string;
    userId: string;
    text: string;
    ts: string;
    edited?: {
        user: string;
        ts: string;
    };
}
