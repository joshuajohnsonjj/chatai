<template>
    <div v-if="$route.meta.type === RouteType.SETTINGS">
        <div
            v-for="page in settingsPages"
            :key="page.name"
            class="d-flex justify-space-between px-4 rounded mt-2 button-hover"
            :class="{ 'selected-chat': $route.name === page.routeName }"
            @click="$router.push({ name: page.routeName })"
        >
            <div class="d-flex justify-start w-100">
                <div class="chat-square my-3 bg-gray" :class="{ 'mx-auto': miniMode }"></div>
                <p v-if="!miniMode" class="pl-4 text-body-1 text-primary" style="line-height: 40px">
                    {{ page.title }}
                </p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { RouteName, RouteType } from '../../types/router';

    defineProps<{
        miniMode: boolean;
    }>();

    const settingsPages = [
        {
            title: 'Profile',
            metaType: RouteType.SETTINGS,
            routeName: RouteName.SETTINGS_PROFILE,
        },
        {
            title: 'Subscription',
            metaType: RouteType.SETTINGS,
            routeName: RouteName.SETTINGS_SUBSCRIPTION,
        },
        {
            title: 'Chat',
            metaType: RouteType.SETTINGS,
            routeName: RouteName.SETTINGS_CHAT,
        },
        {
            title: 'Communication',
            metaType: RouteType.SETTINGS,
            routeName: RouteName.SETTINGS_COMMUNICATION,
        },
    ];
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
