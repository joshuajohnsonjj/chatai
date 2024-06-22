<template>
    <v-sheet
        v-for="thread in messagesHistory"
        :key="thread.threadId"
        class="my-2"
        :class="{ 'z-100': !!replyingInThreadId }"
    >
        <div class="bg-background rounded px-6 pt-6">
            <div v-for="(message, ndx) in thread.messages" :key="message.id">
                <UserChatMessage v-if="!message.isSystemMessage" :text="message.text" />
                <SystemChatMessage
                    v-else
                    :text="message.text"
                    :thread-id="thread.threadId"
                    :is-final="ndx === thread.totalMessageCount - 1"
                    :message-id="message.id"
                    :informers="message.informers"
                />

                <div v-if="shouldShowExpandThreadOption(thread, ndx)" class="mb-6 mt-2 relative">
                    <div class="horizantile-line"></div>
                    <v-btn
                        variant="text"
                        class="text-caption text-primary font-weight-bold text-center rounded button-hover expand-thread-button"
                        :loading="isLoading.threadExpansion"
                        @click="loadFullThread(thread.threadId)"
                    >
                        Show {{ additionalMessageCount(thread) }}+ more
                    </v-btn>
                </div>
            </div>

            <div v-if="pendingThreadResponseId === thread.threadId" class="mt-2 py-2">
                <v-skeleton-loader type="sentences" color="background" :elevation="0"></v-skeleton-loader>
            </div>
        </div>

        <p class="text-caption text-secondary my-2">
            {{ dateToString(thread.messages[0].createdAt) }}
        </p>
    </v-sheet>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../../stores/chat';
    import { dateToString } from '../../utility';
    import { computed } from 'vue';
    import { ChatThreadResponse } from '../../types/responses';

    const chatStore = useChatStore();
    const { pendingThreadResponseId, chatHistory, replyingInThreadId, isLoading, expandedThreads } =
        storeToRefs(chatStore);

    const messagesHistory = computed(() => {
        if (replyingInThreadId.value) {
            return [chatHistory.value.find((thread) => thread.threadId === replyingInThreadId.value)];
        } else {
            return chatHistory.value;
        }
    });

    const shouldShowExpandThreadOption = (thread: ChatThreadResponse, ndx: number): boolean => {
        return (
            thread.totalMessageCount > thread.messages.length &&
            ndx === 1 &&
            !expandedThreads.value.includes(thread.threadId)
        );
    };

    const additionalMessageCount = (thread: ChatThreadResponse) =>
        Math.floor((thread.totalMessageCount - thread.messages.length) / 2);

    const loadFullThread = async (threadId: string) => {
        await chatStore.retrieveFullThread(threadId);
    };
</script>

<style scoped>
    .z-100 {
        z-index: 100;
    }

    .horizantile-line {
        border-top: 1px solid rgb(var(--v-theme-border-color));
    }

    .expand-thread-button {
        position: absolute;
        left: 43%;
        top: -11px;
        width: 100px;
        background: rgb(var(--v-theme-border-color));
        height: 22px;
    }
</style>
