<template>
    <div v-if="$route.meta.type === RouteType.SETTINGS">
        <div
            v-for="page in settingsPages"
            :key="page.title"
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
    ];
</script>

<style scoped>
    .selected-chat {
        background-color: rgba(var(--v-theme-surface-bright), 0.5);
        border-radius: 4px 0 0 4px;
        border: none;
        border-right: 4px solid rgb(var(--v-theme-gray));
    }

    .chat-square {
        height: 15px;
        width: 15px;
    }
</style>
