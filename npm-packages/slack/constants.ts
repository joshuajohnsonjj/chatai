export const SlackBaseUrl = 'https://slack.com/api';

export const SlackHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
};

export enum TSlackEndpoints {
    CONVERSATION_HISTORY = '/conversations.history',
    CONVERSATION_LIST = '/conversations.list',
    USERS_LIST = '/users.list',
}
