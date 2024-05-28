<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <div class="bg-background w-100 pa-6 rounded d-flex justify-start mb-6">
            <v-avatar image="@/assets/companyLogo.jpg" size="60"></v-avatar>
            <div class="ml-4">
                <p class="text-h5 text-primary mb-1">ABC Technology's Data Sources</p>
                <div class="d-flex justify-start">
                    <p class="text-caption text-secondary sub-info-line-height">
                        <HubOutline style="width: 16px; height: 16px; margin-bottom: -3px" class="icon-secondary" />
                        {{ dataSources.length }}
                        {{ planData.maxDataSources ? `of ${planData.maxDataSources}` : '' }} Data sources connected
                    </p>
                    <v-icon icon="mdi-circle-small" color="secondary"></v-icon>
                    <p class="text-caption text-secondary sub-info-line-height">
                        <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                        <!-- TODO: figure out how to calculate storage -->
                        52 of {{ planData.maxStorageMegaBytes }} MB used
                    </p>
                </div>
            </div>
        </div>

        <div v-if="isLoading.dataSourceConnections">
            <div class="d-flex justify-center">
                <v-progress-circular color="secondary" :size="80" indeterminate></v-progress-circular>
            </div>
            <div class="text-secondary text-body-1 text-center my-2">Loading integrations...</div>
        </div>
        <div v-else class="d-flex flex-wrap">
            <div
                v-for="dataSource in dataSources"
                :key="dataSource.id"
                class="bg-background rounded pa-6 ma-2 grow-hover"
                style="min-width: 234px; position: relative"
                @click="$router.push({ name: RouteName.DATA_SOURCE_CONFIG, params: { dataSourceId: dataSource.id } })"
            >
                <div
                    v-if="dataSource.isLiveSync"
                    class="rounded live-sync text-warning text-caption px-2 absolute"
                    style="right: 12px; top: 12px"
                >
                    Real-time
                </div>
                <div
                    v-else-if="dataSource.isSyncing"
                    class="rounded syncing text-caption text-info px-2 absolute"
                    style="right: 12px; top: 12px"
                >
                    Indexing
                </div>

                <div class="d-flex justify-start mb-4">
                    <v-avatar
                        :image="`${BASE_S3_DATASOURCE_LOGO_URL}${dataSource.dataSourceName}.png`"
                        size="45"
                    ></v-avatar>
                    <p class="text-h6 text-primary ml-3" style="line-height: 50px">
                        {{ formatStringStartCase(dataSource.dataSourceName) }}
                    </p>
                </div>
                <p class="text-caption text-secondary mb-1">
                    <v-icon icon="mdi-clock-outline"></v-icon>
                    {{ dataSource.lastSync ? `Synced ${dateToString(dataSource.lastSync)}` : 'Not synced' }}
                </p>
                <p class="text-caption text-secondary">
                    <v-icon icon="mdi-calendar-star"></v-icon>
                    Next Index: 4/22 11:30PM
                </p>
            </div>
        </div>

        <v-btn
            variant="outlined"
            class="w-100 mx-2 mt-6"
            prepend-icon="mdi-plus"
            @click="$router.push({ name: RouteName.BROWSE_DATA_SOURCES })"
        >
            Add Integration
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { onBeforeMount } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../stores/dataSource';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import { dateToString, formatStringStartCase } from '../utility';
    import { RouteName } from '../types/router';
    import { useUserStore } from '../stores/user';

    const dataSourceStore = useDataSourceStore();
    const { connections: dataSources, isLoading } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { planData } = storeToRefs(userStore);

    onBeforeMount(async () => {
        if (!dataSources.value.length) {
            await dataSourceStore.retreiveConnections();
        }
    });
</script>

<style scoped>
    .sub-info-line-height {
        line-height: 23px;
    }

    .live-sync {
        background: rgba(var(--v-theme-warning), 0.25);
    }

    .syncing {
        background: rgba(var(--v-theme-info), 0.25);
    }

    .sync-now {
        background: rgba(var(--v-theme-success), 0.25);
    }
</style>
