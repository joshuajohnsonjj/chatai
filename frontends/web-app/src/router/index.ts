import { createRouter, createWebHistory } from 'vue-router';
import Chat from '../views/Chat.vue';
import Login from '../views/Login.vue';
import DataSources from '../views/DataSources.vue';
import BrowseDataSources from '../views/BrowseDataSources.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'chats',
            component: Chat,
        },
        {
            path: '/chats/:chatId',
            name: 'chat-messages',
            component: Chat,
        },
        {
            path: '/data-sources',
            name: 'data-sources',
            component: DataSources,
        },
        {
            path: '/data-sources/browse',
            name: 'browse-data-sources',
            component: BrowseDataSources,
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
        },
    ],
});

export default router;
