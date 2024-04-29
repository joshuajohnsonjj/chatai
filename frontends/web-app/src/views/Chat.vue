<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6" style="position: relative">
        <div class="w-100 bg-surface header-container bottom-border-primary">
            <div class="d-flex justify-space-between">
                <p class="text-h4 font-weight-medium text-primary pt-6 pb-4 pl-6">{{ selectedChat?.title }}</p>
                <div class="pr-6 pt-4">
                    <v-btn variant="plain" icon="mdi-star-outline"></v-btn>
                    <v-btn variant="plain" icon="mdi-dots-horizontal"></v-btn>
                </div>
            </div>
        </div>

        <div id="chat-scroll" class="d-flex flex-column mb-6">
            <v-sheet v-for="thread in chatHistory" :key="thread.threadId" class="my-2">
                <div class="bg-background rounded pa-6">
                    <div v-for="message in thread.messages" :key="message.id">
                        <div v-if="!message.isSystemMessage" class="bg-surface-bright rounded py-2 px-4 d-flex">
                            <v-avatar image="@/assets/avatar.jpg" size="32"></v-avatar>
                            <p class="ml-4 mt-1 me-auto text-body-1 text-primary">{{ message.text }}</p>
                            <v-btn
                                variant="plain"
                                icon="mdi-square-edit-outline"
                                color="secondary"
                                style="height: 30px; width: 30px"
                            ></v-btn>
                        </div>
                        <div v-else class="system-response-container">
                            <div
                                class="text-body-1 text-primary mt-4 system-message"
                                v-html="markdown(message.text)"
                            ></div>
                        </div>
                    </div>

                    <div v-if="isLoadingThreadResponse === thread.threadId" class="mt-2">
                        <v-skeleton-loader type="paragraph" color="background" :elevation="1"></v-skeleton-loader>
                        <v-skeleton-loader type="sentences" color="background" :elevation="1"></v-skeleton-loader>
                    </div>
                </div>
                <p class="text-caption text-secondary my-2">
                    {{ dateToString(last(thread.messages).createdAt) }}
                </p>
            </v-sheet>
            <div id="bottom-of-chat-scroll" style="height: 1px"></div>
        </div>

        <MessageInput />
    </div>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../stores/chat';
    import { onBeforeMount, onMounted, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import last from 'lodash/last';
    import { dateToString } from '../utility';
    import { markdown } from '../utility/markdown';
    import { useGoTo } from 'vuetify';

    const chatStore = useChatStore();
    const goTo = useGoTo();

    const { chats, selectedChat, chatHistory, isLoadingThreadResponse } = storeToRefs(chatStore);

    const route = useRoute();

    onBeforeMount(async () => {
        if (!chats.value.length) {
            await chatStore.getChatList();
        }
        if (!chatHistory.value.length) {
            await chatStore.setChatHistory(route.params.chatId as string);
        }
    });

    onMounted(() => {
        scrollToBottom();
    });

    watch(selectedChat, async () => {
        scrollToBottom();
    });

    const scrollToBottom = () => {
        goTo('#bottom-of-chat-scroll', {
            container: '#chat-scroll',
            duration: 0,
        });
    };
</script>

<style scoped>
    .header-container {
        position: absolute;
        left: 0;
        border-radius: 24px 24px 0 0;
        z-index: 100;
    }

    #chat-scroll {
        padding-top: 75px;
        max-height: 84vh;
        overflow-y: scroll;
    }
</style>

<style>
    .system-message > ul,
    .system-message > ol {
        padding-left: 1.25rem;
    }
</style>
