<template>
    <div class="fill-height">
        <div class="d-flex justify-space-between">
            <div class="text-h4 font-weight-thin text-primary">Apoio</div>
            <NavOpenClose style="width: 25px" />
        </div>

        <div class="mt-6">
            <div
                v-for="option in menuOptions"
                :key="option.title"
                class="d-flex justify-start px-4 rounded mb-3 button-hover"
                :class="{ selected: $route.meta.type === option.metaType }"
                @click="$router.push({ name: option.routeName })"
            >
                <v-icon :icon="option.icon" :color="option.color" style="height: 45px"></v-icon>
                <p class="pl-4 text-body-1 text-primary" style="line-height: 45px">{{ option.title }}</p>
            </div>

            <HorizontalLine />

            <div v-if="$route.meta.type === 'chat'">
                <div
                    v-for="option in chatOptions"
                    :key="option.id"
                    class="d-flex justify-start px-4 rounded mt-2 button-hover"
                    :class="{ selectedChat: selectedChat?.id === option.id }"
                    @click="onChatSelected(option.id)"
                >
                    <div class="chat-square" :class="`bg-info`"></div>
                    <p class="pl-4 text-body-1 text-primary" style="line-height: 40px">{{ option.title }}</p>
                </div>
            </div>

            <UserAvatar />
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../stores/chat';
    import { useRouter } from 'vue-router';
    import { RouteName, RouteType } from '../types/router';

    const router = useRouter();
    const chatStore = useChatStore();
    const { chats: chatOptions, selectedChat } = storeToRefs(chatStore);

    const menuOptions = [
        {
            title: 'Chats',
            icon: 'mdi-message-text-outline',
            color: 'blue',
            metaType: RouteType.CHAT,
            routeName: RouteName.CHAT,
        },
        {
            title: 'Search',
            icon: 'mdi-magnify',
            color: 'success',
            metaType: RouteType.SEARCH,
            routeName: RouteName.SEARCH,
        },
        {
            title: 'Integrations',
            icon: 'mdi-cloud-outline',
            color: 'pink',
            metaType: RouteType.DATA_SOURCE,
            routeName: RouteName.DATA_SOURCES,
        },
        {
            title: 'Help & support',
            icon: 'mdi-lifebuoy',
            color: 'warning',
            metaType: RouteType.SUPPORT,
            routeName: RouteName.SUPPORT,
        },
        {
            title: 'Settings',
            icon: 'mdi-cog-outline',
            color: 'info',
            metaType: RouteType.SETTINGS,
            routeName: RouteName.SETTINGS,
        },
    ];

    async function onChatSelected(chatId: string) {
        await chatStore.setChatHistory(chatId);
        router.push(`/chats/${chatId}`);
    }
</script>

<style scoped>
    .selected {
        background-color: rgb(var(--v-theme-surface-bright));
    }

    .selectedChat {
        background: linear-gradient(
            90deg,
            rgba(var(--v-theme-gradient-purple), 1) 0%,
            rgba(var(--v-theme-surface-bright), 1)
        );
    }

    .chat-square {
        height: 15px;
        width: 15px;
        margin-top: 13px;
    }
</style>
