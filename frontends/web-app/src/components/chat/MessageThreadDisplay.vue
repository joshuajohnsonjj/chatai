<template>
    <v-sheet
        v-for="thread in messagesHistory"
        :key="thread.threadId"
        class="my-2"
        :class="{ 'z-100': !!replyingInThreadId }"
    >
        <div class="bg-background rounded px-6 pt-6">
            <div v-for="message in thread.messages" :key="message.id">
                <UserChatMessage v-if="!message.isSystemMessage" :text="message.text" />
                <SystemChatMessage v-else :text="message.text" :thread-id="thread.threadId" />
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

    const chatStore = useChatStore();

    const { pendingThreadResponseId, chatHistory, replyingInThreadId } = storeToRefs(chatStore);

    const messagesHistory = computed(() => {
        if (replyingInThreadId.value) {
            return [chatHistory.value.find((thread) => thread.threadId === replyingInThreadId.value)];
        } else {
            return chatHistory.value;
        }
    });
</script>

<style scoped>
    .z-100 {
        z-index: 100;
    }
</style>
