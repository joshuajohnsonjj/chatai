export const SlackBaseUrl = 'https://slack.com/api';

export const SlackHeaders = {
	'Content-Type': 'application/json',
};

export enum TSlackEndpoints {
    CONVERSATION_HISTORY = '/conversations.history',
    CONVERSATION_LIST = '/conversations.list',
}

export enum TSlackChannelType {
    PUBLIC = 'public_channel',
    PRIVATE = 'private_channel',
    MULTI_DM = 'mpim',
    DM = 'im',
}
