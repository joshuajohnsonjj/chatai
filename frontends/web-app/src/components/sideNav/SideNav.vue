<template>
    <div
        class="fill-height"
        ref="navContainer"
        :class="{ 'is-nav-collapsed': !isMenuExpanded, 'is-nav-expanded': isMenuExpanded }"
    >
        <div class="d-flex justify-space-between">
            <div v-if="isMenuExpanded" class="text-h4 font-weight-thin text-primary">Apoio</div>
            <div v-else class="text-h4 font-weight-thin text-primary">A</div>
            <NavOpenClose
                style="width: 25px"
                class="button-hover mr-4"
                :class="{ 'toggle-menu-btn-rotate': !isMenuExpanded, 'toggle-menu-btn': isMenuExpanded }"
                @click="toggleMenu"
            />
        </div>

        <div class="mt-6" :style="isMenuExpanded ? 'height: 71%' : 'height: 79%'">
            <div
                v-for="option in menuOptions"
                :key="option.title"
                class="d-flex justify-start px-4 mb-3 button-hover"
                :class="{
                    selected: $route.meta.type === option.metaType,
                    disabled: option.connectionsRequired && !connections.length,
                }"
                :style="`border-color: rgb(var(--v-theme-${option.color}))`"
                @click="
                    navigate(option.connectionsRequired && !connections.length, option.routeName, option.externalLink)
                "
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
                    class="icon-pink"
                    :class="{ 'mx-auto': !isMenuExpanded }"
                />
                <p class="pl-4 text-body-1 text-primary nav-item-text" style="line-height: 45px">
                    {{ option.title }}
                </p>
            </div>

            <HorizontalLine
                v-if="[RouteType.CHAT, RouteType.SETTINGS].includes($route.meta.type as RouteType)"
                :mr="4"
            />

            <SideNavChatOptions :mini-mode="!isMenuExpanded" />
            <SideNavSettingsOptions :mini-mode="!isMenuExpanded" />
        </div>

        <UserAvatar :mini-mode="!isMenuExpanded" />
    </div>
</template>

<script lang="ts" setup>
    import { RouteName, RouteType } from '../../types/router';
    import { menuOptions } from '../../constants/sideNav';
    import { computed, onBeforeMount, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useChatStore } from '../../stores/chat';
    import { storeToRefs } from 'pinia';
    import { SETTINGS_STORAGE_KEY } from '../../constants/localStorageKeys';
    import { useDataSourceStore } from '../../stores/dataSource';
    import { useToast } from 'vue-toastification';

    const router = useRouter();
    const route = useRoute();

    const toast = useToast();

    const chatStore = useChatStore();
    const { selectedChat } = storeToRefs(chatStore);

    const dataSourceStore = useDataSourceStore();
    const { connections } = storeToRefs(dataSourceStore);

    const isMenuStaticExpanded = ref(
        JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')?.sideNavExpanded !== '0',
    );
    const isMenuHoverExpanded = ref(false);
    const navContainer = ref<HTMLElement | null>(null);

    const isMenuExpanded = computed(() => isMenuStaticExpanded.value || isMenuHoverExpanded.value);

    onBeforeMount(async () => {
        if (!connections.value.length) {
            await dataSourceStore.retreiveConnections();
        }

        if (!connections.value.length) {
            router.push({ name: RouteName.DATA_SOURCES });
        }
    });

    const toggleMenu = () => {
        isMenuStaticExpanded.value = !isMenuStaticExpanded.value;

        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({
                ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}'),
                sideNavExpanded: isMenuStaticExpanded.value ? '1' : '0',
            }),
        );

        if (!isMenuStaticExpanded.value) {
            navContainer.value!.addEventListener('mouseover', onNavMouseOver);
            navContainer.value!.addEventListener('mouseleave', onNavMouseLeave);
        } else {
            navContainer.value!.removeEventListener('mouseover', onNavMouseOver);
            navContainer.value!.removeEventListener('mouseleave', onNavMouseLeave);
        }
    };

    const navigate = (isDisabled: boolean, routeName?: RouteName, externalLink?: string) => {
        if (isDisabled) {
            toast.warning('Add your first integration to begin using this feature');
            return;
        }

        if (externalLink) {
            window.open(externalLink, '_blank')!.focus();
        } else if (routeName === RouteName.CHAT && selectedChat.value && route.meta.type !== RouteType.CHAT) {
            router.push({ name: RouteName.MESSAGES, params: { chatId: selectedChat.value.id } });
            return;
        } else if (routeName === RouteName.CHAT) {
            chatStore.unsetChat();
        }
        router.push({ name: routeName });
    };

    const onNavMouseOver = () => {
        isMenuHoverExpanded.value = true;
    };

    const onNavMouseLeave = () => {
        isMenuHoverExpanded.value = false;
    };
</script>

<style scoped>
    .selected {
        background-color: rgba(var(--v-theme-surface-bright), 0.5);
        border-radius: 4px 0 0 4px;
        border: none;
        border-right: 4px solid;
    }

    .toggle-menu-btn-rotate {
        transform: rotateY(180deg);
        transition: all 0.5s;
    }

    .toggle-menu-btn {
        transform: rotateY(0deg);
        transition: all 0.5s;
    }

    .is-nav-expanded {
        width: 290px;
        transition: all 0.5s;

        .nav-item-text {
            display: block;
        }
    }

    .is-nav-collapsed {
        width: 80px;
        transition: all 0.5s;

        .nav-item-text {
            display: none;
        }
    }

    .disabled {
        filter: brightness(70%) !important;
        cursor: not-allowed !important;
    }
</style>
