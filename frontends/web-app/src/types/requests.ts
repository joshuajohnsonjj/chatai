export enum APIEndpoints {
    LOGIN = '/v1/userAuth/login',
    REFRESH = '/v1/userAuth/refresh',
    USER_INFO = '/v1/user',
    CHATS_LIST = '/v1/chat',
    CHATS_HISTORY = '/v1/chat/:chatId',
    SEND_CHAT = '/v1/chat/:chatId',
    DATA_SOURCE_CONNECTION = '/v1/dataSource/connections',
    DATA_SOURCE = '/v1/dataSource',
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
