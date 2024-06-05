<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.push({ name: RouteName.DATA_SOURCES })"
        ></v-btn>

        <div class="bg-background w-100 pa-6 rounded mb-6 mt-4 d-flex justify-space-between">
            <div class="d-flex justify-start">
                <v-avatar
                    :image="`${BASE_S3_DATASOURCE_LOGO_URL}${currentConfiguring?.dataSourceName}.png`"
                    size="80"
                ></v-avatar>
                <div class="ml-4">
                    <div class="d-flex justify-start">
                        <p class="text-h5 text-primary mb-1 font-weight-medium">
                            {{ formatStringStartCase(currentConfiguring?.dataSourceName ?? '') }} Integration Details
                        </p>

                        <HelpBox
                            class="icon-primary grow-hover button-hover ml-2 pb-6"
                            style="width: 15px"
                            @click="openDocs"
                        />

                        <div v-if="currentConfiguring?.isSyncing" class="px-2">
                            <v-tooltip text="Indexing in progress" location="top" max-width="300">
                                <template v-slot:activator="{ props }">
                                    <v-icon
                                        class="spining"
                                        icon="mdi-sync"
                                        size="large"
                                        color="info"
                                        v-bind="props"
                                    ></v-icon>
                                </template>
                            </v-tooltip>
                        </div>
                    </div>

                    <div class="d-flex justify-start">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-calendar-star" color="secondary"></v-icon>
                            Next index {{ moment(currentConfiguring?.nextScheduledSync).format('M/D H:MM A') }}
                        </p>
                        <v-icon icon="mdi-circle-small" color="secondary"></v-icon>
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-calendar-blank" color="secondary"></v-icon>
                            Linked since {{ moment(currentConfiguring?.createdAt).format('M/D/YYYY') }}
                        </p>
                    </div>

                    <p class="text-caption text-secondary sub-info-line-height">
                        <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                        {{
                            currentConfiguring?.mbStorageEstimate > 0
                                ? currentConfiguring?.mbStorageEstimate.toFixed(2)
                                : '0'
                        }}
                        MB stored
                    </p>
                </div>
            </div>

            <div style="width: 250px">
                <v-btn
                    class="w-100 mb-2"
                    color="info"
                    prepend-icon="mdi-eye"
                    variant="tonal"
                    @click="redirectToSourceDataView"
                    >View data</v-btn
                >
                <v-btn
                    v-if="currentConfiguring?.dataSourceManualSyncAllowed && !currentConfiguring?.isSyncing"
                    class="w-100 mb-2"
                    color="success"
                    prepend-icon="mdi-cloud-sync"
                    variant="tonal"
                    :loading="isLoading.indexNowInvocation"
                    @click="indexNow"
                    >Index now</v-btn
                >
            </div>
        </div>

        <v-row>
            <v-col cols="6">
                <AccessManagement />
            </v-col>
            <v-col cols="6">
                <IndexingConfiguration />
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-sheet class="border-primary rounded pa-6">
                    <p class="text-h6 text-primary font-weight-medium">Other Configurations</p>
                    <v-btn class="body-action-btn" color="warning" prepend-icon="mdi-trash-can" variant="tonal"
                        >Remove integration</v-btn
                    >
                </v-sheet>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" setup>
    import { onBeforeMount } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../stores/dataSource';
    import { useUserStore } from '../stores/user';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import { formatStringStartCase } from '../utility';
    import { useRoute, useRouter } from 'vue-router';
    import moment from 'moment';
    import { useToast } from 'vue-toastification';
    import { KnowledgeBaseMap } from '../constants/knowledgeBase';
    import { RouteName } from '../types/router';
    import { SearchQueryParamType } from '../types/search-store';
    import { useSearchStore } from '../stores/search';
    import { DataSourceTypeName } from '../types/responses';

    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const dataSourceStore = useDataSourceStore();
    const { connections, isLoading, currentConfiguring } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { userEntityId } = storeToRefs(userStore);

    const searchStore = useSearchStore();

    onBeforeMount(async () => {
        if (!connections.value.length) {
            await dataSourceStore.retreiveConnections();
        }

        dataSourceStore.setCurrentConfiguring(route.params.dataSourceId as string);

        if (route.query.a && route.query.r) {
            await dataSourceStore.updateOAuthCredentials(route.query.a as string, route.query.r as string);
        }
    });

    const indexNow = async () => {
        switch (currentConfiguring.value?.dataSourceName) {
            case DataSourceTypeName.GOOGLE_DRIVE:
                return; //await dataSourceStore.initiateGoogleDriveSync(currentConfiguring.value.id!);
            default:
                toast.error('Manual indexing not allowed for this integration');
        }
    };

    const redirectToSourceDataView = () => {
        searchStore.clearQueryParams();
        searchStore.addQueryParam(SearchQueryParamType.SOURCE, currentConfiguring.value?.dataSourceName!);
        searchStore.executeSearchQuery(userEntityId.value);

        router.push({ name: RouteName.SEARCH });
    };

    const openDocs = () =>
        window.open(KnowledgeBaseMap[currentConfiguring.value?.dataSourceName as string].root, '_blank')!.focus();
</script>

<style scoped>
    .filter-selected {
        background-color: rgb(var(--v-theme-background));
    }

    .disabled {
        font-weight: normal !important;
        filter: brightness(100%) !important;
        cursor: not-allowed !important;
        color: rgb(var(--v-theme-secondary)) !important;
    }

    .body-action-btn {
        width: 200px;
    }
</style>
