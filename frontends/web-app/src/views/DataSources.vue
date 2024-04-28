<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <div class="bg-background w-100 pa-6 rounded d-flex justify-start mb-6">
            <v-avatar image="@/assets/companyLogo.jpg" size="60"></v-avatar>
            <div class="ml-4">
                <p class="text-h5 text-primary mb-1">ABC Technology's Data Sources</p>
                <div class="d-flex justify-start">
                    <p class="text-caption text-secondary sub-info-line-height">
                        <v-icon icon="mdi-cloud-outline" color="secondary"></v-icon>
                        {{ dataSources.length }} Data sources
                    </p>
                    <v-icon icon="mdi-circle-small" color="secondary"></v-icon>
                    <p class="text-caption text-secondary sub-info-line-height">
                        <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                        37 GB used
                    </p>
                </div>
            </div>
        </div>

        <div class="d-flex flex-wrap">
            <div
                v-for="dataSource in dataSources"
                :key="dataSource.id"
                class="bg-background rounded pa-6 ma-2 grow-hover"
                style="min-width: 234px; position: relative"
                @click="$router.push({ name: RouteName.DATA_SOURCE_CONFIG, params: { dataSourceId: dataSource.id } })"
            >
                <div
                    v-if="dataSource.isLiveSync"
                    class="rounded live-sync text-warning text-caption px-2"
                    style="position: absolute; right: 12px; top: 12px"
                >
                    Live sync
                </div>
                <div
                    v-else-if="dataSource.isSyncing"
                    class="rounded syncing text-caption text-info px-2"
                    style="position: absolute; right: 12px; top: 12px"
                >
                    Syncing
                </div>
                <div
                    v-else
                    class="rounded sync-now text-caption text-success px-2 button-hover"
                    style="position: absolute; right: 12px; top: 12px"
                >
                    Sync now
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
                    Next Sync: 4/22 11:30PM
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
    
    const dataSourceStore = useDataSourceStore();
    const { connections: dataSources } = storeToRefs(dataSourceStore);

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
