export enum APIEndpoints {
    REGISTER = '/v1/auth/user/register',
    CONFIRM_SIGNUP = '/v1/auth/user/confirm',
    LOGIN = '/v1/auth/user/login',
    REFRESH = '/v1/auth/user/refresh',
    PASSWORD_CHANGE = '/v1/auth/user/password/change',
    USER = '/v1/user',
    USER_IMAGE = '/v1/user/image',
    USER_SETTINGS = '/v1/user/settings',
    CHATS = '/v1/chat',
    CHAT = '/v1/chat/:chatId',
    CHAT_MESSAGES = '/v1/chat/:chatId/message',
    CHAT_MESSAGE = '/v1/chat/:chatId/message/:messageId',
    CHAT_MESSAGE_THREAD = '/v1/chat/:chatId/thread/:threadId',
    DATA_SOURCE_CONNECTIONS = '/v1/dataSource/connections',
    DATA_SOURCE_CONNECTION = '/v1/dataSource/connections/:dataSourceId',
    DATA_SOURCE = '/v1/dataSource',
    DATA_SOURCE_SYNC = '/v1/dataSource/connections/:dataSourceId/sync',
    TEST_DATA_SOURCE = '/v1/dataSource/connections/test',
    SEARCH = '/v1/search',
    TOPIC_SUGGESTIONS = '/v1/search/suggestions/topics',
    SEARCH_RESULT = '/v1/search/:resultId/data',
}

export enum GoogleAuthEndpoint {
    USER = '/v1/auth/google/authorize/user',
    GMAIL = '/v1/auth/google/authorize/gmail',
    DRIVE = '/v1/auth/google/authorize/drive',
    ALL = '/v1/auth/google/authorize/all',
}

export enum APIMethods {
    GET = 'get',
    POST = 'post',
    PATCH = 'patch',
    DELETE = 'delete',
}

export interface UpdateUserDetailRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    accessToken: string;
}
