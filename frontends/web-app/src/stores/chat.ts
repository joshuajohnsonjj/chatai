import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ChatMessageResponse, ChatResponse, ChatThreadResponse } from '../types/responses';
import {
    createChat,
    getChatHistory,
    getThreadById,
    listChats,
    retrieveChatMessage,
    sendChatMessage,
    sendEditChatMessage,
    updateChatDetail,
} from '../requests/chat';
import find from 'lodash/find';
import remove from 'lodash/remove';
import orderBy from 'lodash/orderBy';
import { useToast } from 'vue-toastification';
import { v4 } from 'uuid';
import { ChatResponseTone, UpdateChatParams } from '../types/chat-store';
import { useUserStore } from './user';

const toast = useToast();

export const useChatStore = defineStore('chat', () => {
    const chats = ref<ChatResponse[]>([]);
    const selectedChat = ref<ChatResponse | null>(null);
    const chatHistory = ref<ChatThreadResponse[]>([]);
    const nextChatHistoryPageNdx = ref<number>(0);
    const hasMoreChatHistoryResults = ref<boolean>(false);
    const replyingInThreadId = ref<string | null>(null);
    const expandedThreads = ref<string[]>([]);

    const pendingThreadResponseId = ref<string | null>(null);
    const pendingEditMessageResponseId = ref<string | null>(null);

    const isLoading = ref({
        chatList: false,
        chatHistory: false,
        chatUpdate: false,
        threadExpansion: false,
        createChat: false,
    });

    const chatSettings = computed(() => {
        const userInfo = useUserStore().userData;

        return {
            chatCreativity: selectedChat.value?.chatCreativity ?? userInfo?.settings.chatCreativity ?? 7,
            chatMinConfidence: selectedChat.value?.chatMinConfidence ?? userInfo?.settings.chatMinConfidence ?? 7,
            chatTone: selectedChat.value?.chatTone ?? userInfo?.settings.chatTone ?? ChatResponseTone.DEFAULT,
            baseInstructions: selectedChat.value?.baseInstructions ?? userInfo?.settings.baseInstructions ?? null,
        };
    });

    const getChatList = async () => {
        isLoading.value.chatList = true;

        try {
            const chatData = await listChats();
            chats.value = orderBy(chatData.chats, (chat) => !chat.isFavorited);
        } finally {
            isLoading.value.chatList = false;
        }
    };

    const updateChat = async (chatId: string, updates: UpdateChatParams) => {
        isLoading.value.chatUpdate = true;

        try {
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

            if ('isFavorited' in updates) {
                chats.value = orderBy(chats.value, (chat) => !chat.isFavorited);
            }
        } finally {
            isLoading.value.chatUpdate = false;
        }
    };

    const unsetChat = () => {
        selectedChat.value = null;
        chatHistory.value = [];
        nextChatHistoryPageNdx.value = 0;
        hasMoreChatHistoryResults.value = false;
        expandedThreads.value = [];
        replyingInThreadId.value = null;
    };

    const createNewChat = async (associatedEntityId: string, title?: string) => {
        isLoading.value.createChat = true;

        try {
            const newChat = await createChat(associatedEntityId, title);
            chats.value.unshift(newChat);
            selectedChat.value = newChat;
        } finally {
            isLoading.value.createChat = false;
        }
    };

    const setChatHistory = async (chatId: string) => {
        const selected = find(chats.value, (chat) => chat.id === chatId);

        if (!selected) {
            toast.error('Chat not found');
            return;
        }

        isLoading.value.chatHistory = true;

        try {
            selectedChat.value = selected;
            const chatHistoryData = await getChatHistory(selected.id, nextChatHistoryPageNdx.value);
            chatHistory.value = [...chatHistoryData.threads, ...chatHistory.value];
            nextChatHistoryPageNdx.value += 1;
            hasMoreChatHistoryResults.value = chatHistoryData.responseSize === chatHistoryData.pageSize;
        } finally {
            isLoading.value.chatHistory = false;
        }
    };

    const retrieveFullThread = async (threadId: string) => {
        isLoading.value.threadExpansion = true;

        try {
            const thread = await getThreadById(selectedChat.value!.id, threadId);

            const historyThreadNdx = chatHistory.value.findIndex((history) => history.threadId === threadId);
            chatHistory.value.splice(historyThreadNdx, 1, thread);

            expandedThreads.value.push(threadId);
        } finally {
            isLoading.value.threadExpansion = false;
        }
    };

    const condenseThread = (threadId: string) => {
        const historyThreadNdx = chatHistory.value.findIndex((history) => history.threadId === threadId);
        const threadMessageLength = chatHistory.value[historyThreadNdx].messages.length;

        chatHistory.value[historyThreadNdx].messages = [
            chatHistory.value[historyThreadNdx].messages[0],
            chatHistory.value[historyThreadNdx].messages[1],
            chatHistory.value[historyThreadNdx].messages[threadMessageLength - 2],
            chatHistory.value[historyThreadNdx].messages[threadMessageLength - 1],
        ];

        remove(expandedThreads.value, (expandedThreadId) => expandedThreadId === threadId);
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            informers: [],
        };

        if (replyingInThreadId.value) {
            newOrFoundThread = find(chatHistory.value, (thread) => thread.threadId === threadId) as ChatThreadResponse;
            newOrFoundThread.messages.push(promptMessage);
            newOrFoundThread.totalMessageCount += 1;
        } else {
            newOrFoundThread = {
                threadId,
                totalMessageCount: 1,
                timestamp: new Date().toISOString(),
                messages: [promptMessage],
            };
            chatHistory.value.push(newOrFoundThread);
        }

        pendingThreadResponseId.value = threadId;

        try {
            const systemRsponseId = v4();
            const aiResponseStream = await sendChatMessage(selectedChat.value.id, {
                userPromptMessageId: promptMessage.id,
                userPromptText: promptMessage.text,
                threadId: newOrFoundThread.threadId,
                systemResponseMessageId: systemRsponseId,
                isReplyMessage: !!replyingInThreadId.value,
                creativitySetting: chatSettings.value.chatCreativity,
                confidenceSetting: chatSettings.value.chatMinConfidence,
                toneSetting: chatSettings.value.chatTone,
                baseInstructions: chatSettings.value.baseInstructions,
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
                createdAt: new Date().toISOString(),
                informers: [],
            });

            const reader = aiResponseStream!.getReader();
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

            const savedSystemResponse = await retrieveChatMessage(selectedChat.value.id, systemRsponseId);
            chatHistory.value[threadNdx].messages[newThreadLength - 1].informers = savedSystemResponse.informers;
            chatHistory.value[threadNdx].totalMessageCount += 1;
        } catch (e) {
            console.log(e);
            toast.error('Response generation failed. Contact support if problem persists.');
        } finally {
            pendingThreadResponseId.value = null;
        }
    };

    const updateMessage = async (
        text: string,
        userPromptMessageId: string,
        systemResponseMessageId: string,
        threadId: string,
    ) => {
        if (!selectedChat.value) {
            return;
        }

        const threadNdx = chatHistory.value.findIndex((histThread) => histThread.threadId === threadId);
        const messageThread = chatHistory.value[threadNdx];

        const userMessageNdxInThread = messageThread?.messages.findIndex(
            (message) => message.id === userPromptMessageId,
        );
        const originalUserMessage = messageThread.messages[userMessageNdxInThread];

        const systemMessageNdxInThread = messageThread?.messages.findIndex(
            (message) => message.id === systemResponseMessageId,
        );
        const originalSystemMessage = messageThread.messages[systemMessageNdxInThread];

        const isReplyMessage = (messageThread?.totalMessageCount ?? 0) > 2 && (userMessageNdxInThread ?? 0) >= 2;

        pendingEditMessageResponseId.value = systemResponseMessageId;

        try {
            chatHistory.value[threadNdx].messages[userMessageNdxInThread] = {
                ...originalUserMessage,
                text,
            };
            chatHistory.value[threadNdx].messages[systemMessageNdxInThread] = {
                ...originalSystemMessage,
                text: '',
            };

            const aiResponseStream = await sendEditChatMessage(selectedChat.value.id, {
                userPromptMessageId,
                userPromptText: text,
                threadId,
                systemResponseMessageId,
                isReplyMessage,
                creativitySetting: chatSettings.value.chatCreativity,
                confidenceSetting: chatSettings.value.chatMinConfidence,
                toneSetting: chatSettings.value.chatTone,
                baseInstructions: chatSettings.value.baseInstructions,
            });

            chatHistory.value[threadNdx].messages[systemMessageNdxInThread].informers = [];

            const reader = aiResponseStream!.getReader();
            let done = false,
                value;
            while (!done) {
                ({ value, done } = await reader.read());
                if (done) {
                    break;
                }
                pendingEditMessageResponseId.value = null;
                chatHistory.value[threadNdx].messages[systemMessageNdxInThread].text += String.fromCharCode.apply(
                    null,
                    value,
                );
            }

            const savedSystemResponse = await retrieveChatMessage(selectedChat.value.id, systemResponseMessageId);
            chatHistory.value[threadNdx].messages[systemMessageNdxInThread].informers = savedSystemResponse.informers;
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
        pendingEditMessageResponseId,
        isLoading,
        replyingInThreadId,
        expandedThreads,
        setChatHistory,
        unsetChat,
        getChatList,
        sendMessage,
        updateMessage,
        setReplyMode,
        updateChat,
        retrieveFullThread,
        condenseThread,
        createNewChat,
    };
});
