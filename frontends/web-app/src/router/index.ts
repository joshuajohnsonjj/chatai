import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import Chat from '../views/Chat.vue';
import NewChat from '../views/NewChat.vue';
import Login from '../views/Login.vue';
import Signup from '../views/Signup.vue';
import PlanSelection from '../views/PlanSelection.vue';
import DataSources from '../views/DataSources.vue';
import Search from '../views/Search.vue';
import Support from '../views/Support.vue';
import Settings from '../views/Settings.vue';
import BrowseDataSources from '../views/BrowseDataSources.vue';
import DataSourceConfigure from '../views/DataSourceConfigure.vue';
import { useUserStore } from '../stores/user';

const onBeforeEnter = async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
) => {
    const userStore = useUserStore();

    if (!userStore.userData.id) {
        await userStore.setCurrentUser();
    }

    if (!userStore.userData.id) {
        next({ name: 'login' });
        return;
    }

    next();
};

// TODO: create enums for route data
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        /**
         * Chat routes
         */
        {
            path: '/',
            name: 'chats',
            meta: {
                type: 'chat',
                sideNavEnabled: true,
            },
            component: NewChat,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/chats/:chatId',
            name: 'chat-messages',
            meta: {
                type: 'chat',
                sideNavEnabled: true,
            },
            component: Chat,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        /**
         * Search routes
         */
        {
            path: '/search',
            name: 'search',
            meta: {
                type: 'search',
                sideNavEnabled: true,
            },
            component: Search,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/support',
            name: 'support',
            meta: {
                type: 'support',
                sideNavEnabled: true,
            },
            component: Support,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/settings',
            name: 'settings',
            meta: {
                type: 'settings',
                sideNavEnabled: true,
            },
            component: Settings,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        /**
         * Data source routes
         */
        {
            path: '/data-sources',
            name: 'data-sources',
            meta: {
                type: 'data-source',
                sideNavEnabled: true,
            },
            component: DataSources,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources/:dataSourceId/configure',
            name: 'data-source-configure',
            meta: {
                type: 'data-source',
                sideNavEnabled: true,
            },
            component: DataSourceConfigure,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources/browse',
            name: 'browse-data-sources',
            meta: {
                type: 'data-source',
                sideNavEnabled: true,
            },
            component: BrowseDataSources,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        /**
         * Auth/Onboarding routes
         */
        {
            path: '/login',
            name: 'login',
            meta: {
                type: 'auth',
                sideNavEnabled: false,
            },
            component: Login,
        },
        {
            path: '/signup',
            name: 'signup',
            meta: {
                type: 'auth',
                sideNavEnabled: false,
            },
            component: Signup,
        },
        {
            path: '/onboarding/plan-selection',
            name: 'plan-selection',
            meta: {
                type: 'onboarding',
                sideNavEnabled: false,
            },
            component: PlanSelection,
        },
    ],
});

export default router;
