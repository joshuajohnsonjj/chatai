import type { SendMessageParams, UpdateChatParams } from '../types/chat-store';
import { APIEndpoints, APIMethods } from '../types/requests';
import type { ChatResponse, ListChatHistoryResponse, ListChatsResponse } from '../types/responses';
import { sendAPIRequest } from './service';
import { TOKEN_STORAGE_KEY } from '../constants';

// TODO: implement pagination
export const listChats = async (): Promise<ListChatsResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHATS}?${new URLSearchParams({ page: '0' })}`,
    });
    return resp as ListChatsResponse;
};

export const updateChatDetail = async (chatId: string, chatUpdates: UpdateChatParams): Promise<ChatResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.PATCH,
        headers: {
            'Content-Type': 'application/json',
        },
        data: chatUpdates,
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHAT.replace(':chatId', chatId)}`,
    });
    return resp as ChatResponse;
};

export const getChatHistory = async (chatId: string, page: number): Promise<ListChatHistoryResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHAT_MESSAGES.replace(':chatId', chatId)}?${new URLSearchParams({ page: page.toString() })}`,
    });
    return resp as ListChatHistoryResponse;
};

export const sendChatMessage = async (chatId: string, params: SendMessageParams): Promise<any> => {
    const tokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}');
    const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${APIEndpoints.CHAT_MESSAGES.replace(':chatId', chatId)}`,
        {
            headers: {
                Authorization: `Bearer ${tokenData.accessToken}`,
                'Content-Type': 'application/json',
            },
            method: APIMethods.POST,
            body: JSON.stringify(params),
        },
    );

    return response.body;
};
