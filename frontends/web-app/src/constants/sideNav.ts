import { RouteName, RouteType } from '../types/router';

export const menuOptions = [
    {
        title: 'Chats',
        icon: 'mdi-message-text-outline',
        color: 'blue',
        metaType: RouteType.CHAT,
        routeName: RouteName.CHAT,
        connectionsRequired: true,
    },
    {
        title: 'Search',
        icon: 'mdi-magnify',
        color: 'success',
        metaType: RouteType.SEARCH,
        routeName: RouteName.SEARCH,
        connectionsRequired: true,
    },
    {
        title: 'Integrations',
        icon: 'mdi-hub-outline',
        color: 'pink',
        metaType: RouteType.DATA_SOURCE,
        routeName: RouteName.DATA_SOURCES,
    },
    {
        title: 'Help & support',
        icon: 'mdi-lifebuoy',
        color: 'warning',
        externalLink: 'https://chatai.freshdesk.com/support/home',
    },
    {
        title: 'Settings',
        icon: 'mdi-cog-outline',
        color: 'info',
        metaType: RouteType.SETTINGS,
        routeName: RouteName.SETTINGS_PROFILE,
    },
];
