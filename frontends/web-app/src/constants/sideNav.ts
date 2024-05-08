import { RouteName, RouteType } from '../types/router';

export const menuOptions = [
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
        icon: 'mdi-hub-outline',
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
        routeName: RouteName.SETTINGS_PROFILE,
    },
];
