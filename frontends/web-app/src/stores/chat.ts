import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChatMessageResponse, ChatResponse, ChatThreadResponse } from '../types/responses';
import { getChatHistory, listChats, sendChatMessage } from '../requests/chat';
import { find } from 'lodash';
import { useToast } from 'vue-toastification';
import { v4 } from 'uuid';

const toast = useToast();

export const useChatStore = defineStore('chat', () => {
    const chats = ref<ChatResponse[]>([]);
    const selectedChat = ref<ChatResponse | null>(null);
    const chatHistory = ref<ChatThreadResponse[]>([]);
    const replyingInThreadId = ref<string | null>(null);
    const isLoading = ref(false);
    const isLoadingThreadResponse = ref<string | null>(null);

    const getChatList = async () => {
        isLoading.value = true;
        const chatData = await listChats();
        chats.value = chatData.chats;
        isLoading.value = false;
    };

    const setChatHistory = async (chatId: string) => {
        const selected = find(chats.value, (chat) => chat.id === chatId);

        if (!selected) {
            toast.error('Chat not found');
            return;
        }

        isLoading.value = true;
        selectedChat.value = selected;
        const chatHistoryData = await getChatHistory(selected.id);
        chatHistory.value = chatHistoryData.threads;
        isLoading.value = false;
    };

    const setReplyMode = (threadId: string | null) => {
        replyingInThreadId.value = threadId;
    };

    const sendMessage = async (text: string, replyThreadId?: string) => {
        if (!selectedChat.value) {
            return;
        }

        let thread: ChatThreadResponse;
        const threadId = replyThreadId ?? v4();
        const promptMessage: ChatMessageResponse = {
            id: v4(),
            text,
            isSystemMessage: false,
            chatId: selectedChat.value.id,
            threadId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (replyThreadId) {
            thread = find(chatHistory.value, (thread) => thread.threadId === threadId) as ChatThreadResponse;
            thread!.messages.push(promptMessage);
        } else {
            thread = {
                threadId,
                messages: [promptMessage],
            };
            chatHistory.value.push(thread);
        }

        isLoadingThreadResponse.value = threadId;
        const aiResponse = await sendChatMessage(selectedChat.value.id, text, thread!.threadId);
        find(chatHistory.value, (opt) => opt.threadId === thread.threadId)!.messages.push(aiResponse);
        isLoadingThreadResponse.value = null;
    };

    return {
        chats,
        selectedChat,
        chatHistory,
        isLoadingThreadResponse,
        isLoading,
        replyingInThreadId,
        setChatHistory,
        getChatList,
        sendMessage,
        setReplyMode,
    };
});
