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
    channels: {
        id: string;
        name: string;
        // skiping irrelevant keys...
    }[];
    response_metadata: {
        next_cursor: string;
    };
}

export interface SlackUserListRequestParams {
    limit?: number;
    cursor?: string;
}

export interface SlackUserListResponse {
    ok: boolean;
    members: {
        id: string;
        real_name: string;
        profile: {
            email: string;
        };
    }[];
    response_metadata: {
        next_cursor: string;
    };
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
