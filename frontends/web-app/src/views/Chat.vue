<template>
    <FullScreenBackgroundBlur v-if="!!replyingInThreadId" @click="onExitReplyMode" />

    <div class="bg-surface w-100 h-100 rounded-xl px-6 relative">
        <div class="w-100 bg-surface header-container bottom-border-primary">
            <div class="d-flex justify-space-between">
                <div class="d-flex justify-start">
                    <p v-if="!editTitle" class="text-h4 font-weight-medium text-primary pt-6 pb-4 pl-6">
                        {{ selectedChat?.title }}
                    </p>
                    <v-text-field
                        v-else
                        variant="solo"
                        class="pt-6 pb-4 pl-6"
                        style="width: 300px"
                        v-model="titleEditField"
                        @input="editTitleStarted = true"
                    ></v-text-field>
                    <v-icon
                        v-if="!editTitle && selectedChat?.isArchived === false"
                        icon="mdi-pencil"
                        color="secondary"
                        size="x-small"
                        class="button-hover mt-6 ml-2"
                        @click="
                            editTitle = true;
                            titleEditField = selectedChat.title;
                        "
                    ></v-icon>
                    <v-row v-else-if="selectedChat?.isArchived === false" class="pl-6">
                        <v-col cols="12" class="pa-0 mt-6" style="height: 10px">
                            <v-btn
                                variant="text"
                                :disabled="!editTitleStarted"
                                color="blue"
                                @click="onTitleEditSaved"
                                :loading="isLoading.chatUpdate"
                                >save</v-btn
                            >
                        </v-col>
                        <v-col cols="12" class="pa-0">
                            <v-btn variant="text" color="secondary" @click="onTitleEditCanceled">cancel</v-btn>
                        </v-col>
                    </v-row>
                    <v-chip v-if="selectedChat?.isArchived" color="warning" class="ml-4 mt-7">Archived</v-chip>
                </div>

                <div class="pr-6 pt-4 d-flex justify-end">
                    <v-btn
                        variant="plain"
                        :icon="selectedChat?.isFavorited ? 'mdi-star' : 'mdi-star-outline'"
                        :color="selectedChat?.isFavorited ? 'gold' : 'secondary'"
                        @click="onToggleFavorite"
                    ></v-btn>

                    <VDropdown v-if="!isChatSettingsOpen" :distance="-12" class="mt-4">
                        <button><v-icon icon="mdi-dots-horizontal" color="secondary"></v-icon></button>

                        <template #popper>
                            <ChatTooltipMenuOptions @open-archive-modal="isConfirmArchive = true" />
                        </template>
                    </VDropdown>
                    <v-btn
                        v-else
                        variant="plain"
                        icon="mdi-close"
                        color="secondary"
                        @click="$router.push($route.path)"
                    ></v-btn>
                </div>
            </div>
        </div>

        <div class="d-flex justify-space-between" style="height: 100%">
            <div style="max-width: 800px" class="mx-auto">
                <div
                    id="chat-scroll"
                    ref="chatScrollContainer"
                    :class="{ 'reply-mode-chat-scroll': !!replyingInThreadId }"
                >
                    <div v-if="isLoading.chatHistory" style="width: 80px; margin: auto">
                        <v-progress-circular
                            class="mt-8"
                            color="secondary"
                            :size="80"
                            indeterminate
                        ></v-progress-circular>
                    </div>

                    <div id="bottom-of-chat-scroll" style="height: 1px"></div>

                    <MessageThreadDisplay />
                </div>

                <MessageInput
                    @reply-mode-exited="onExitReplyMode"
                    @input-height-changed="(sizeDiff: number) => handleInputHeightChange(sizeDiff)"
                />
            </div>

            <v-expand-x-transition>
                <ChatSettingsSideBar v-if="isChatSettingsOpen" />
            </v-expand-x-transition>
        </div>

        <v-fade-transition>
            <div
                v-if="shouldShowScrollToBottomButton"
                id="floating-to-bottom-btn"
                class="bg-surface shadow button-hover"
                @click="scrollToBottom(300)"
            >
                <v-icon icon="mdi-chevron-down" size="large" color="primary"></v-icon>
            </div>
        </v-fade-transition>
    </div>

    <ConfirmModal
        v-if="isConfirmArchive"
        :max-width="500"
        title="Confrim chat archival"
        sub-title="Archived chats will be automatially removed after 7 days"
        button-theme="warning"
        @close-modal="isConfirmArchive = false"
        @confirmed="onArchiveConfirmed"
    />
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../stores/chat';
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useGoTo } from 'vuetify';
    import debounce from 'lodash/debounce';

    const chatStore = useChatStore();
    const goTo = useGoTo();
    const route = useRoute();
    const router = useRouter();

    const { chats, selectedChat, chatHistory, replyingInThreadId, isLoading, hasMoreChatHistoryResults } =
        storeToRefs(chatStore);

    const editTitle = ref<boolean>(false);
    const editTitleStarted = ref<boolean>(false);
    const titleEditField = ref<string>('');
    const isConfirmArchive = ref<boolean>(false);
    const chatScrollContainer = ref<HTMLElement | null>(null);
    const chatScrollPosition = ref<number>(0);
    const shouldShowScrollToBottomButton = ref<boolean>(false);

    const isChatSettingsOpen = computed(() => route.query.settings === 'true');

    onMounted(async () => {
        if (!chats.value.length) {
            await chatStore.getChatList();
        }

        if (!chatHistory.value.length && !route.query.create) {
            await chatStore.setChatHistory(route.params.chatId as string);
        }

        router.replace({ query: {} });

        scrollToBottom();

        chatScrollContainer.value!.addEventListener('scroll', debounce(onScroll, 100));
    });

    onBeforeUnmount(() => {
        chatScrollContainer.value!.removeEventListener('scroll', debounce(onScroll, 100));
    });

    watch(selectedChat, async () => {
        scrollToBottom();
    });

    const scrollToBottom = (duration = 0) => {
        goTo('#bottom-of-chat-scroll', {
            container: '#chat-scroll',
            duration,
            easing: 'easeOutQuad',
        });
    };

    const onTitleEditCanceled = () => {
        editTitle.value = false;
        editTitleStarted.value = false;
        titleEditField.value = selectedChat.value!.title;
    };

    const onTitleEditSaved = async () => {
        await chatStore.updateChat(selectedChat.value!.id, { title: titleEditField.value });
        onTitleEditCanceled();
    };

    const onArchiveConfirmed = async () => {
        await chatStore.updateChat(selectedChat.value!.id, { isArchived: true });
    };

    const onToggleFavorite = async () => {
        await chatStore.updateChat(selectedChat.value!.id, { isFavorited: !selectedChat.value!.isFavorited });
    };

    const onExitReplyMode = () => {
        chatStore.setReplyMode(null);
        goTo(chatScrollPosition.value, {
            container: '#chat-scroll',
            duration: 0,
            easing: 'easeOutQuad',
        });
    };

    const handleInputHeightChange = (sizeDiff: number) => {
        chatScrollContainer.value!.style.height = `calc(85vh - ${sizeDiff}rem)`;
    };

    const onScroll = () => {
        // track scroll possition for returning after reply mode exit
        if (!replyingInThreadId.value && chatScrollContainer.value) {
            chatScrollPosition.value = chatScrollContainer.value.scrollTop;
        }

        // pagination handling
        if (
            chatScrollContainer.value &&
            chatScrollContainer.value &&
            Math.abs(chatScrollContainer.value.scrollTop) > 0.75 * chatScrollContainer.value.scrollHeight &&
            hasMoreChatHistoryResults.value &&
            !isLoading.value.chatHistory &&
            !replyingInThreadId.value
        ) {
            chatStore.setChatHistory(route.params.chatId as string);
        }

        // quick scroll to bottom button conditional render
        if (chatScrollContainer.value && Math.abs(chatScrollContainer.value.scrollTop) > 1250) {
            shouldShowScrollToBottomButton.value = true;
        } else {
            shouldShowScrollToBottomButton.value = false;
        }
    };
</script>

<style scoped>
    .header-container {
        position: absolute;
        left: 0;
        border-radius: 24px 24px 0 0;
        z-index: 50;
    }

    #chat-scroll {
        overflow-y: scroll;
        -ms-overflow-style: none;
        scrollbar-width: none;
        height: 75vh;
        margin-top: 5rem;
        display: flex;
        flex-direction: column-reverse;
    }

    .reply-mode-chat-scroll {
        height: 85vh !important;
        margin-top: 0 !important;
    }

    #chat-scroll::-webkit-scrollbar {
        display: none;
    }

    #floating-to-bottom-btn {
        padding: 10px;
        margin: auto;
        width: 48px;
        left: 0;
        right: 0;
        position: absolute;
        border-radius: 50%;
        bottom: 15%;
    }
</style>

<!-- Unscoped for v-html message rendering -->
<style>
    .system-message > ul,
    .system-message > ol {
        padding-left: 1.25rem;
    }
</style>
