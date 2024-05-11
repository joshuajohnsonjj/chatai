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
        <div class="d-flex justify-start px-4 rounded mt-2 button-hover">
            <v-icon
                icon="mdi-plus-circle"
                color="secondary"
                size="x-small"
                class="mt-3"
                :class="{ 'mx-auto': miniMode }"
            ></v-icon>
            <p v-if="!miniMode" class="pl-4 text-body-1 text-primary" style="line-height: 40px">New chat</p>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { RouteName, RouteType } from '../../types/router';
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../../stores/chat';
    import { useRouter } from 'vue-router';

    defineProps<{
        miniMode: boolean;
    }>();

    const router = useRouter();
    const chatStore = useChatStore();
    const { chats: chatOptions, selectedChat } = storeToRefs(chatStore);

    // TODO: implement chats list pagination
    async function onChatSelected(chatId: string) {
        await chatStore.setChatHistory(chatId);
        router.push({ name: RouteName.MESSAGES, params: { chatId } });
    }
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
