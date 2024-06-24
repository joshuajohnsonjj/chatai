<template>
    <div v-if="$route.meta.type === RouteType.CHAT">
        <div v-if="isViewingArchived">
            <v-btn
                variant="plain"
                density="compact"
                class="text-caption"
                color="primary"
                prepend-icon="mdi-arrow-left"
                @click="onBackToUnarchived"
                >Unarchived chats</v-btn
            >
        </div>

        <div v-if="isLoading.chatList" style="width: 30px; margin: auto">
            <v-progress-circular class="mt-8" color="secondary" :size="30" indeterminate></v-progress-circular>
        </div>

        <div
            v-if="!isLoading.chatList"
            v-for="option in chatOptions"
            :key="option.id"
            class="d-flex justify-space-between px-4 mt-2 button-hover"
            :class="{
                'selected-chat': selectedChat?.id === option.id,
                'border-gray': !option.isFavorited && !option.isArchived,
                'border-gold': option.isFavorited && !option.isArchived,
                'border-red': option.isArchived,
            }"
            @click="onChatSelected(option.id)"
        >
            <div class="d-flex justify-start w-100">
                <div
                    class="chat-square my-3"
                    :class="{
                        'mx-auto': miniMode,
                        'bg-gray': !option.isFavorited && !option.isArchived,
                        'bg-gold': option.isFavorited && !option.isArchived,
                        'bg-warning': option.isArchived,
                    }"
                ></div>
                <p v-if="!miniMode" class="pl-4 text-body-1 text-primary" style="line-height: 40px">
                    {{ option.title }}
                </p>
            </div>
            <v-btn
                v-if="!miniMode"
                icon="mdi-dots-horizontal"
                variant="plain"
                color="secondary"
                style="height: 40px"
            ></v-btn>
        </div>

        <div
            v-if="!isNamingNewChat && !isViewingArchived"
            class="d-flex justify-start px-4 rounded mt-2 button-hover"
            @click="isNamingNewChat = true"
        >
            <v-icon
                icon="mdi-plus-circle"
                color="secondary"
                size="x-small"
                class="mt-3"
                :class="{ 'mx-auto': miniMode }"
            ></v-icon>
            <p v-if="!miniMode" class="pl-4 text-body-1 text-primary" style="line-height: 40px">New chat</p>
        </div>
        <div v-else-if="!isViewingArchived" class="mt-2 mr-2">
            <v-text-field
                variant="underlined"
                label="New chat name"
                density="compact"
                class="mb-2"
                v-model="newChatName"
            ></v-text-field>
            <div class="d-flex justify-end">
                <v-btn density="compact" variant="tonal" color="secondary" @click="cancelCreateChat">cancel</v-btn>
                <v-btn
                    class="ml-4"
                    color="blue"
                    density="compact"
                    variant="tonal"
                    @click="createChat"
                    :loading="isLoading.createChat"
                    >create</v-btn
                >
            </div>
        </div>

        <div v-if="!isNamingNewChat && !isViewingArchived">
            <v-btn variant="plain" density="compact" class="text-caption" color="warning" @click="onViewArchived"
                >View archived</v-btn
            >
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { RouteName, RouteType } from '../../types/router';
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../../stores/chat';
    import { useRouter } from 'vue-router';
    import { ref } from 'vue';
    import { useUserStore } from '../../stores/user';

    defineProps<{
        miniMode: boolean;
    }>();

    const router = useRouter();

    const chatStore = useChatStore();
    const { chats: chatOptions, selectedChat, isLoading } = storeToRefs(chatStore);

    const userStore = useUserStore();

    const isNamingNewChat = ref(false);
    const newChatName = ref('');
    const isViewingArchived = ref(false);

    const onChatSelected = async (chatId: string) => {
        chatStore.unsetChat();
        await chatStore.setChatHistory(chatId);
        router.push({ name: RouteName.MESSAGES, params: { chatId } });
    };

    const cancelCreateChat = () => {
        isNamingNewChat.value = false;
        newChatName.value = '';
    };

    const createChat = async () => {
        isNamingNewChat.value = false;

        await chatStore.createNewChat(userStore.userEntityId, newChatName.value);

        newChatName.value = '';

        router.push({
            name: RouteName.MESSAGES,
            params: { chatId: selectedChat.value!.id },
            query: { create: 'true' },
        });
    };

    const onViewArchived = async () => {
        await chatStore.getChatList(true);
        isViewingArchived.value = true;
    };

    const onBackToUnarchived = async () => {
        await chatStore.getChatList();
        isViewingArchived.value = false;
    };
</script>

<style scoped>
    .selected-chat {
        background-color: rgba(var(--v-theme-surface-bright), 0.5);
        border-radius: 4px 0 0 4px;
        border: none;
        border-right: 4px solid;
    }

    .border-gray {
        border-color: rgb(var(--v-theme-gray));
    }

    .border-gold {
        border-color: rgb(var(--v-theme-gold));
    }

    .border-red {
        border-color: rgb(var(--v-theme-warning));
    }

    .chat-square {
        height: 15px;
        width: 15px;
    }
</style>
