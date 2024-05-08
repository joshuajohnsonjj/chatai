import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import Chat from '../views/Chat.vue';
import NewChat from '../views/NewChat.vue';
import Login from '../views/Login.vue';
import Signup from '../views/Signup.vue';
import PlanSelection from '../views/PlanSelection.vue';
import DataSources from '../views/DataSources.vue';
import Search from '../views/Search.vue';
import SearchResultDetail from '../views/SearchResultDetail.vue';
import Support from '../views/Support.vue';
import ProfileSettings from '../views/Settings/ProfileSettings.vue';
import ChatSettings from '../views/Settings/ChatSettings.vue';
import SubscriptionSettings from '../views/Settings/SubscriptionSettings.vue';
import CommunicationSettings from '../views/Settings/CommunicationSettings.vue';
import BrowseDataSources from '../views/BrowseDataSources.vue';
import DataSourceConfigure from '../views/DataSourceConfigure.vue';
import DataSourceAdd from '../views/DataSourceAdd.vue';
import { useUserStore } from '../stores/user';
import { RouteName, RouteType } from '../types/router';

const onBeforeEnter = async (
    _to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
) => {
    const userStore = useUserStore();

    if (!userStore.userData?.id) {
        await userStore.setCurrentUser();
    }

    if (!userStore.userData?.id) {
        next({ name: 'login' });
        return;
    }

    next();
};

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        /**
         * Chat routes
         */
        {
            path: '/',
            name: RouteName.CHAT,
            meta: {
                type: RouteType.CHAT,
                sideNavEnabled: true,
            },
            component: NewChat,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/chats/:chatId',
            name: RouteName.MESSAGES,
            meta: {
                type: RouteType.CHAT,
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
            name: RouteName.SEARCH,
            meta: {
                type: RouteType.SEARCH,
                sideNavEnabled: true,
            },
            component: Search,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/search/:resultId/detail',
            name: RouteName.SEARCH_RESULT,
            meta: {
                type: RouteType.SEARCH,
                sideNavEnabled: true,
            },
            component: SearchResultDetail,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        {
            path: '/support',
            name: RouteName.SUPPORT,
            meta: {
                type: RouteType.SUPPORT,
                sideNavEnabled: true,
            },
            component: Support,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        /**
         * settings routes
         */
        {
            path: '/settings/profile',
            name: RouteName.SETTINGS_PROFILE,
            meta: {
                type: RouteType.SETTINGS,
                sideNavEnabled: true,
            },
            component: ProfileSettings,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/settings/chat',
            name: RouteName.SETTINGS_CHAT,
            meta: {
                type: RouteType.SETTINGS,
                sideNavEnabled: true,
            },
            component: ChatSettings,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/settings/communication',
            name: RouteName.SETTINGS_COMMUNICATION,
            meta: {
                type: RouteType.SETTINGS,
                sideNavEnabled: true,
            },
            component: CommunicationSettings,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/settings/subscription',
            name: RouteName.SETTINGS_SUBSCRIPTION,
            meta: {
                type: RouteType.SETTINGS,
                sideNavEnabled: true,
            },
            component: SubscriptionSettings,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        /**
         * Data source routes
         */
        {
            path: '/data-sources',
            name: RouteName.DATA_SOURCES,
            meta: {
                type: RouteType.DATA_SOURCE,
                sideNavEnabled: true,
            },
            component: DataSources,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources/:dataSourceId/configure',
            name: RouteName.DATA_SOURCE_CONFIG,
            meta: {
                type: RouteType.DATA_SOURCE,
                sideNavEnabled: true,
            },
            component: DataSourceConfigure,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources/types/:dataSourceTypeId/add',
            name: RouteName.DATA_SOURCE_ADD,
            meta: {
                type: RouteType.DATA_SOURCE,
                sideNavEnabled: true,
            },
            component: DataSourceAdd,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },
        {
            path: '/data-sources/browse',
            name: RouteName.BROWSE_DATA_SOURCES,
            meta: {
                type: RouteType.DATA_SOURCE,
                sideNavEnabled: true,
            },
            component: BrowseDataSources,
            beforeEnter: (to, from, next) => onBeforeEnter(to, from, next),
        },

        /**
         * Auth routes
         */
        {
            path: '/login',
            name: RouteName.LOGIN,
            meta: {
                type: RouteType.AUTH,
                sideNavEnabled: false,
            },
            component: Login,
        },
        {
            path: '/signup',
            name: RouteName.SIGNUP,
            meta: {
                type: RouteType.AUTH,
                sideNavEnabled: false,
            },
            component: Signup,
        },

        /**
         * Onboarding routes
         */
        {
            path: '/onboarding/plan-selection',
            name: RouteName.PLAN_SELECT,
            meta: {
                type: RouteType.ONBOARDING,
                sideNavEnabled: false,
            },
            component: PlanSelection,
        },
    ],
});

export default router;
