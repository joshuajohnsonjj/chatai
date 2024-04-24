<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6" style="position: relative">
        <div style="z-index: 100">
            <div class="w-100 bg-surface header-container">
                <div class="d-flex justify-space-between">
                    <p class="text-h4 font-weight-medium text-primary pt-6 pb-4 pl-6">{{ selectedChat?.title }}</p>
                    <div class="pr-6 pt-4">
                        <v-btn variant="plain" icon="mdi-star-outline"></v-btn>
                        <v-btn variant="plain" icon="mdi-dots-horizontal"></v-btn>
                    </div>
                </div>
            </div>
        </div>

        <div class="d-flex flex-column mb-6 chat-scroll">
            <v-sheet v-for="thread in chatHistory" :key="thread.threadId" class="my-2">
                <div class="bg-background rounded pa-6">
                    <div v-for="message in thread.messages" :key="message.id">
                        <div v-if="!message.isSystemMessage" class="bg-surface-bright rounded py-2 px-4 d-flex">
                            <v-avatar image="@/assets/avatar.jpg" size="32"></v-avatar>
                            <p class="ml-4 mt-1 me-auto text-paragraph text-primary">{{ message.text }}</p>
                            <v-btn
                                variant="plain"
                                icon="mdi-tooltip-edit-outline"
                                color="secondary"
                                style="height: 30px; width: 30px"
                            ></v-btn>
                        </div>
                        <div v-else>
                            <p class="text-paragraph text-primary mt-4">
                                {{ message.text }}
                            </p>
                        </div>
                    </div>
                </div>
                <p class="text-paragraph text-secondary mt-2">
                    {{ dateToString(last(thread.messages).createdAt) }}
                </p>
            </v-sheet>
        </div>

        <v-text-field rows="1" placeholder="Ask me something..." variant="outlined" class="message-input">
            <div class="py-2 px-3 bg-blue rounded" style="position: absolute; right: 1rem">
                <v-icon icon="mdi-arrow-up"></v-icon>
            </div>
        </v-text-field>
    </div>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../stores/chat';
    import { onBeforeMount } from 'vue';
    import { useRoute } from 'vue-router';
    import last from 'lodash/last';
    import { dateToString } from '../utility';

    const chatStore = useChatStore();
    const { chats, selectedChat, chatHistory } = storeToRefs(chatStore);

    const route = useRoute();

    onBeforeMount(async () => {
        if (!chats.value.length) {
            await chatStore.getChatList();
        }
        if (!chatHistory.value.length) {
            await chatStore.setChatHistory(route.params.chatId as string);
        }
    });
</script>

<style scoped>
    .message-input {
        position: absolute;
        bottom: 20px;
        width: 95%;
    }

    .header-container {
        position: absolute;
        left: 0;
        border-radius: 24px 24px 0 0;
        border-bottom: 1px solid rgb(var(--v-theme-border-color));
    }

    .chat-scroll {
        padding-top: 75px;
        max-height: 84vh;
        overflow-y: scroll;
    }
</style>
