export enum APIEndpoints {
    LOGIN = '/v1/userAuth/login',
    REFRESH = '/v1/userAuth/refresh',
    USER_INFO = '/v1/user',
    CHATS = '/v1/chat',
    CHAT = '/v1/chat/:chatId',
    CHAT_MESSAGES = '/v1/chat/:chatId/message',
    CHAT_MESSAGE = '/v1/chat/:chatId/message/:messageId',
    DATA_SOURCE_CONNECTIONS = '/v1/dataSource/connections',
    DATA_SOURCE_CONNECTION = '/v1/dataSource/connections/:dataSourceId',
    DATA_SOURCE = '/v1/dataSource',
    DATA_SOURCE_SYNC = '/v1/dataSource/connections/:dataSourceId/sync',
    TEST_DATA_SOURCE = '/v1/dataSource/connections/test',
    SEARCH = '/v1/search',
    TOPIC_SUGGESTIONS = '/v1/search/suggestions/topics',
    SEARCH_RESULT = '/v1/search/:resultId/data',
}

export enum APIMethods {
    GET = 'get',
    POST = 'post',
    PATCH = 'patch',
    DELETE = 'delete',
}
