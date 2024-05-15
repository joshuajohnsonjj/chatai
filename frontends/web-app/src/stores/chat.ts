import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChatMessageResponse, ChatResponse, ChatThreadResponse } from '../types/responses';
import { getChatHistory, listChats, sendChatMessage, updateChatDetail } from '../requests/chat';
import find from 'lodash/find';
import { useToast } from 'vue-toastification';
import { v4 } from 'uuid';
import { ChatResponseTone, UpdateChatParams } from '../types/chat-store';

const toast = useToast();

export const useChatStore = defineStore('chat', () => {
    const chats = ref<ChatResponse[]>([]);
    const selectedChat = ref<ChatResponse | null>(null);
    const chatHistory = ref<ChatThreadResponse[]>([]);
    const nextChatHistoryPageNdx = ref<number>(0);
    const hasMoreChatHistoryResults = ref<boolean>(false);
    const replyingInThreadId = ref<string | null>(null);
    const isLoading = ref({
        chatList: false,
        chatHistory: false,
        chatUpdate: false,
    });
    const pendingThreadResponseId = ref<string | null>(null);

    const getChatList = async () => {
        isLoading.value.chatList = true;
        const chatData = await listChats();
        chats.value = chatData.chats;
        isLoading.value.chatList = false;
    };

    const updateChat = async (chatId: string, updates: UpdateChatParams) => {
        isLoading.value.chatUpdate = true;

        const response = await updateChatDetail(chatId, updates);

        if (updates.isArchived) {
            toast.warning('Chat archived');
        } else if (updates.isArchived === false) {
            toast.success('Chat unarchived');
        } else {
            toast.success('Chat details updated');
        }

        const ndx = chats.value.findIndex((chat) => chat.id === response.id);
        chats.value[ndx] = response;

        if (selectedChat.value?.id === response.id) {
            selectedChat.value = response;
        }

        isLoading.value.chatUpdate = false;
    };

    const unsetChat = () => {
        selectedChat.value = null;
        chatHistory.value = [];
    };

    const setChatHistory = async (chatId: string) => {
        const selected = find(chats.value, (chat) => chat.id === chatId);

        if (!selected) {
            toast.error('Chat not found');
            return;
        }

        isLoading.value.chatHistory = true;

        selectedChat.value = selected;
        const chatHistoryData = await getChatHistory(selected.id, nextChatHistoryPageNdx.value);
        chatHistory.value = [...chatHistoryData.threads, ...chatHistory.value];
        nextChatHistoryPageNdx.value += 1;
        hasMoreChatHistoryResults.value = chatHistoryData.responseSize === chatHistoryData.pageSize;

        isLoading.value.chatHistory = false;
    };

    const setReplyMode = (threadId: string | null) => {
        replyingInThreadId.value = threadId;
    };

    const sendMessage = async (text: string) => {
        if (!selectedChat.value) {
            return;
        }

        let newOrFoundThread: ChatThreadResponse;
        const threadId = replyingInThreadId.value ?? v4();

        const promptMessage: ChatMessageResponse = {
            id: v4(),
            text,
            isSystemMessage: false,
            chatId: selectedChat.value.id,
            threadId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (replyingInThreadId.value) {
            newOrFoundThread = find(chatHistory.value, (thread) => thread.threadId === threadId) as ChatThreadResponse;
            newOrFoundThread.messages.push(promptMessage);
            newOrFoundThread.totalMessageCount += 1;
        } else {
            newOrFoundThread = {
                threadId,
                totalMessageCount: 1,
                timestamp: new Date(),
                messages: [promptMessage],
            };
            chatHistory.value.push(newOrFoundThread);
        }

        pendingThreadResponseId.value = threadId;

        try {
            const systemRsponseId = v4();
            // TODO: use settings values
            const aiResponseStream = await sendChatMessage(selectedChat.value.id, {
                userPromptMessageId: promptMessage.id,
                userPromptText: promptMessage.text,
                threadId: newOrFoundThread.threadId,
                systemResponseMessageId: systemRsponseId,
                isReplyMessage: !!replyingInThreadId.value,
                creativitySetting: 8,
                confidenceSetting: 7,
                toneSetting: ChatResponseTone.DEFAULT,
                baseInstructions: null,
            });

            const threadNdx = chatHistory.value.findIndex(
                (histThread) => histThread.threadId === newOrFoundThread.threadId,
            );

            const newThreadLength = chatHistory.value[threadNdx].messages.push({
                id: systemRsponseId,
                text: '',
                isSystemMessage: true,
                chatId: selectedChat.value.id,
                threadId: newOrFoundThread.threadId,
                createdAt: new Date(),
            });

            const reader = aiResponseStream.getReader();
            let done = false,
                value;
            while (!done) {
                ({ value, done } = await reader.read());
                if (done) {
                    break;
                }
                pendingThreadResponseId.value = null;
                chatHistory.value[threadNdx].messages[newThreadLength - 1].text += String.fromCharCode.apply(
                    null,
                    value,
                );
            }
            // TODO: retrieve response data from db to get extra info
        } catch (e) {
            console.log(e);
            toast.error('Response generation failed. Contact support if problem persists.');
        } finally {
            pendingThreadResponseId.value = null;
        }
    };

    return {
        chats,
        selectedChat,
        chatHistory,
        hasMoreChatHistoryResults,
        pendingThreadResponseId,
        isLoading,
        replyingInThreadId,
        setChatHistory,
        unsetChat,
        getChatList,
        sendMessage,
        setReplyMode,
        updateChat,
    };
});
