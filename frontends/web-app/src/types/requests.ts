export enum APIEndpoints {
    LOGIN = '/v1/userAuth/login',
    REFRESH = '/v1/userAuth/refresh',
    USER_INFO = '/v1/user',
    CHATS_LIST = '/v1/chat',
    CHATS_HISTORY = '/v1/chat/:chatId',
    SEND_CHAT = '/v1/chat/:chatId',
}

export enum APIMethods {
    LOGIN = 'post',
    REFRESH = 'post',
    USER_INFO = 'get',
    CHATS_LIST = 'get',
    CHATS_HISTORY = 'get',
    SEND_CHAT = 'post',
}
