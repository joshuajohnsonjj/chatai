import { APIEndpoints, APIMethods } from '../types/requests';
import type { ChatMessageResponse, ListChatHistoryResponse, ListChatsResponse } from '../types/responses';
import { sendAPIRequest } from './service';

// TODO: implement pagination
export const listChats = async (): Promise<ListChatsResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.CHATS_LIST,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: `${APIEndpoints.CHATS_LIST}?${new URLSearchParams({ page: '0' })}`,
    });
    return resp as ListChatsResponse;
};

export const getChatHistory = async (chatId: string): Promise<ListChatHistoryResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.CHATS_HISTORY,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: `${APIEndpoints.CHATS_HISTORY.replace(':chatId', chatId)}?${new URLSearchParams({ page: '0' })}`,
    });
    return resp as ListChatHistoryResponse;
};

export const sendChatMessage = async (chatId: string, text: string, threadId?: string,): Promise<ChatMessageResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.SEND_CHAT,
        data: {
            threadId,
            text,
        },
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: APIEndpoints.SEND_CHAT.replace(':chatId', chatId),
    });
    return resp as ChatMessageResponse;
};
