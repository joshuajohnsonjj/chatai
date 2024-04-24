import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import Chat from '../views/Chat.vue';
import NewChat from '../views/NewChat.vue';
import Login from '../views/Login.vue';
import DataSources from '../views/DataSources.vue';
import Search from '../views/Search.vue';
import Support from '../views/Support.vue';
import Settings from '../views/Settings.vue';
import BrowseDataSources from '../views/BrowseDataSources.vue';
import { useUserStore } from '../stores/user';
import { useChatStore } from '../stores/chat';

// const onChatViewsEnter = () => {
//     const chatStore = useChatStore();
//     if (!chatStore.chats.length) {
//         chatStore.getChatList();
//     }
// }

const onBeforeEnter = async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
) => {
    const userStore = useUserStore();

    if (to.name !== 'login' && !userStore.userData.id) {
        await userStore.setCurrentUser();
    }

    if (to.name !== 'login' && !userStore.userData.id) {
        next({ name: 'login' });
        return;
    }

    // if (to.meta.type === 'chat') {
    //     onChatViewsEnter();
    // }

    next();
};

// TODO: create enums for route data
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'chats',
            meta: {
                type: 'chat',
            },
            component: NewChat,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/chats/:chatId',
            name: 'chat-messages',
            meta: {
                type: 'chat',
            },
            component: Chat,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/search',
            name: 'search',
            meta: {
                type: 'search',
            },
            component: Search,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/support',
            name: 'support',
            meta: {
                type: 'support',
            },
            component: Support,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/settings',
            name: 'settings',
            meta: {
                type: 'settings',
            },
            component: Settings,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources',
            name: 'data-sources',
            meta: {
                type: 'data-source',
            },
            component: DataSources,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources/browse',
            name: 'browse-data-sources',
            meta: {
                type: 'data-source',
            },
            component: BrowseDataSources,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
    ],
});

export default router;
