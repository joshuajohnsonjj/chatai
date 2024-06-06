export const SlackBaseUrl = 'https://slack.com/api';

export const SlackHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
};

export enum SlackEndpoints {
    CONVERSATION_HISTORY = '/conversations.history',
    CONVERSATION_LIST = '/conversations.list',
    CONVERSATION_INFO = '/conversations.info',
    USERS_LIST = '/users.list',
    USER_INFO = '/users.info',
    APP_ACTIVITY_LIST = '/apps.activities.list',
}

export enum SlackErros {
    ACCESS_DENIED = 'access_denied',
    INVALID_APP_ID = 'invalid_app_id',
    INVALID_APP = 'invalid_app',
}
