<template>
    <div class="fill-height">
        <div class="d-flex justify-space-between">
            <div v-if="isMenuExpanded" class="text-h4 font-weight-thin text-primary">Apoio</div>
            <div v-else class="text-h4 font-weight-thin text-primary">A</div>
            <NavOpenClose
                style="width: 25px"
                class="button-hover"
                :class="{ 'toggle-menu-btn-rotate': !isMenuExpanded }"
                @click="toggleMenu"
            />
        </div>

        <div class="mt-6" :style="isMenuExpanded ? 'height: 71%' : 'height: 79%'">
            <div
                v-for="option in menuOptions"
                :key="option.title"
                class="d-flex justify-start px-4 rounded mb-3 button-hover"
                :class="{ selected: $route.meta.type === option.metaType }"
                @click="navigate(option.routeName)"
            >
                <v-icon
                    v-if="option.icon !== 'mdi-hub-outline'"
                    :icon="option.icon"
                    :color="option.color"
                    style="height: 45px"
                    :class="{ 'mx-auto': !isMenuExpanded }"
                ></v-icon>
                <HubOutline
                    v-else
                    style="width: 24px; height: 45px"
                    class="hub-icon-pink"
                    :class="{ 'mx-auto': !isMenuExpanded }"
                />
                <p v-if="isMenuExpanded" class="pl-4 text-body-1 text-primary" style="line-height: 45px">
                    {{ option.title }}
                </p>
            </div>

            <HorizontalLine v-if="[RouteType.CHAT, RouteType.SETTINGS].includes($route.meta.type)" />

            <SideNavChatOptions :mini-mode="!isMenuExpanded" />
        </div>

        <UserAvatar :mini-mode="!isMenuExpanded" />
    </div>
</template>

<script lang="ts" setup>
    import { RouteName, RouteType } from '../../types/router';
    import { menuOptions } from '../../constants/sideNav';
    import { ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useChatStore } from '../../stores/chat';
    import { storeToRefs } from 'pinia';

    const router = useRouter();
    const route = useRoute();

    const chatStore = useChatStore();
    const { selectedChat } = storeToRefs(chatStore);

    const isMenuExpanded = ref(true);

    const toggleMenu = () => {
        isMenuExpanded.value = !isMenuExpanded.value;
    };

    const navigate = (routeName: RouteName) => {
        if (routeName === RouteName.CHAT && selectedChat.value && route.meta.type !== RouteType.CHAT) {
            router.push({ name: RouteName.MESSAGES, params: { chatId: selectedChat.value.id } });
            return;
        } else if (routeName === RouteName.CHAT) {
            chatStore.unsetChat();
        }
        router.push({ name: routeName });
    };
</script>

<style scoped>
    .selected {
        background-color: rgb(var(--v-theme-surface-bright));
    }

    .toggle-menu-btn-rotate {
        transform: rotateY(180deg);
    }
</style>
