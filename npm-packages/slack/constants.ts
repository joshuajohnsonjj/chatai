export const SlackBaseUrl = 'https://slack.com/api';

export const SlackHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
};

export enum TSlackEndpoints {
    CONVERSATION_HISTORY = '/conversations.history',
    CONVERSATION_LIST = '/conversations.list',
    CONVERSATION_INFO = '/conversations.info',
    USERS_LIST = '/users.list',
    USER_INFO = '/users.info',
}

export const SlackRedisKey = {
    USER: (id: string) => `SlackUser:${id}`,
    CHANNEL: (id: string) => `SlackChannel:${id}`,
};
