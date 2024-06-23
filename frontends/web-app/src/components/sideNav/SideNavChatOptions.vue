<template>
    <div v-if="$route.meta.type === RouteType.CHAT">
        <div
            v-for="option in chatOptions"
            :key="option.id"
            class="d-flex justify-space-between px-4 rounded mt-2 button-hover"
            :class="{ 'selected-chat': selectedChat?.id === option.id }"
            @click="onChatSelected(option.id)"
        >
            <div class="d-flex justify-start w-100">
                <div class="chat-square my-3 bg-info" :class="{ 'mx-auto': miniMode }"></div>
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
            v-if="!isNamingNewChat"
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
        <div v-else class="mt-2 mr-2">
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
</script>

<style scoped>
    .selected-chat {
        background: linear-gradient(
            90deg,
            rgba(var(--v-theme-gradient-purple), 1) 0%,
            rgba(var(--v-theme-surface-bright), 1)
        );
    }

    .chat-square {
        height: 15px;
        width: 15px;
    }
</style>
