import { ChatType, type SendMessageParams, type UpdateChatParams } from '../types/chat-store';
import { APIEndpoints, APIMethods } from '../types/requests';
import type {
    ChatMessageResponse,
    ChatResponse,
    ChatThreadResponse,
    ListChatHistoryResponse,
    ListChatsResponse,
} from '../types/responses';
import { sendAxiosRequest, sendFetchRequest } from './service';

export const createChat = async (associatedEntityId: string, title?: string): Promise<ChatResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.POST,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.CHATS,
        data: {
            chatType: ChatType.SYSTEM,
            associatedEntityId,
            title,
        },
    });
    return resp as ChatResponse;
};

export const listChats = async (getArchived: boolean): Promise<ListChatsResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHATS}?${new URLSearchParams({ page: '0', getArchived: getArchived ? '1' : '0' })}`,
    });
    return resp as ListChatsResponse;
};

export const updateChatDetail = async (chatId: string, chatUpdates: UpdateChatParams): Promise<ChatResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.PATCH,
        headers: { 'Content-Type': 'application/json' },
        data: chatUpdates,
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHAT.replace(':chatId', chatId)}`,
    });
    return resp as ChatResponse;
};

export const getChatHistory = async (chatId: string, page: number): Promise<ListChatHistoryResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHAT_MESSAGES.replace(':chatId', chatId)}?${new URLSearchParams({ page: page.toString() })}`,
    });
    return resp as ListChatHistoryResponse;
};

export const sendChatMessage = async (chatId: string, params: SendMessageParams) => {
    return await sendFetchRequest(
        `${(import.meta as any).env.VITE_API_BASE_URL}${APIEndpoints.CHAT_MESSAGES.replace(':chatId', chatId)}`,
        {
            method: APIMethods.POST,
            body: JSON.stringify(params),
        },
    );
};

export const sendEditChatMessage = async (chatId: string, params: SendMessageParams) => {
    return await sendFetchRequest(
        `${(import.meta as any).env.VITE_API_BASE_URL}${APIEndpoints.CHAT_MESSAGE.replace(':chatId', chatId).replace(':messageId', params.userPromptMessageId)}`,
        {
            method: APIMethods.POST,
            body: JSON.stringify(params),
        },
    );
};

export const retrieveChatMessage = async (chatId: string, messageId: string): Promise<ChatMessageResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHAT_MESSAGE.replace(':chatId', chatId).replace(':messageId', messageId)}`,
    });
    return resp as ChatMessageResponse;
};

export const getThreadById = async (chatId: string, threadId: string): Promise<ChatThreadResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: `${APIEndpoints.CHAT_MESSAGE_THREAD.replace(':chatId', chatId).replace(':threadId', threadId)}`,
    });
    return resp as ChatThreadResponse;
};
