<template>
    <FullScreenBackgroundBlur v-if="!!replyingInThreadId" @click="chatStore.setReplyMode(null)" />

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
                    <v-btn variant="plain" icon="mdi-star-outline" color="secondary"></v-btn>
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

        <div class="d-flex justify-space-between">
            <div style="max-width: 800px" class="mx-auto">
                <div id="chat-scroll" ref="chatScrollContainer" class="d-flex flex-column mb-6">
                    <div v-if="!replyingInThreadId">
                        <v-sheet v-for="thread in chatHistory" :key="thread.threadId" class="my-2">
                            <MessageThreadDisplay :threadContent="thread" />

                            <p class="text-caption text-secondary my-2">
                                {{ dateToString(thread.messages[0].createdAt) }}
                            </p>
                        </v-sheet>
                    </div>

                    <ChatReplyContainer v-else />

                    <div id="bottom-of-chat-scroll" style="height: 1px"></div>
                </div>

                <MessageInput />
            </div>

            <ChatSettingsSideBar v-if="isChatSettingsOpen" />
        </div>
    </div>

    <ConfirmModal
        v-if="isConfirmArchive"
        :max-width="500"
        title="Confrim chat archival"
        sub-title="Archived chats will be automatially removed after 7 days"
        @close-modal="isConfirmArchive = false"
        @confirmed="onArchiveConfirmed"
    />
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../stores/chat';
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    import { useGoTo } from 'vuetify';
    import debounce from 'lodash/debounce';
    import { dateToString } from '../utility';
    import ChatReplyContainer from '../components/chat/ChatReplyContainer.vue';

    const chatStore = useChatStore();
    const goTo = useGoTo();
    const route = useRoute();

    const { chats, selectedChat, chatHistory, replyingInThreadId, isLoading, hasMoreChatHistoryResults } =
        storeToRefs(chatStore);

    const editTitle = ref<boolean>(false);
    const editTitleStarted = ref<boolean>(false);
    const titleEditField = ref<string>('');
    const isConfirmArchive = ref<boolean>(false);
    const chatScrollContainer = ref<HTMLElement | null>(null);

    const isChatSettingsOpen = computed(() => route.query.settings === 'true');

    onMounted(async () => {
        if (!chats.value.length) {
            await chatStore.getChatList();
        }
        if (!chatHistory.value.length) {
            await chatStore.setChatHistory(route.params.chatId as string);
        }
        scrollToBottom();

        chatScrollContainer.value!.addEventListener('scroll', debounce(onScroll, 100));
    });

    onBeforeUnmount(() => {
        chatScrollContainer.value!.removeEventListener('scroll', debounce(onScroll, 100));
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

    /**
     * Scroll based pagination handler
     */
    const onScroll = () => {
        if (
            (chatScrollContainer.value?.scrollTop ?? 1750) < 1750 &&
            hasMoreChatHistoryResults.value &&
            !isLoading.value.chatHistory
        ) {
            chatStore.setChatHistory(route.params.chatId as string);
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
        padding-top: 75px;
        max-height: 86vh;
        overflow-y: scroll;
    }

    #chat-scroll::-webkit-scrollbar {
        display: none;
    }

    #chat-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>

<!-- Unscoped for v-html message rendering -->
<style>
    .system-message > ul,
    .system-message > ol {
        padding-left: 1.25rem;
    }
</style>
