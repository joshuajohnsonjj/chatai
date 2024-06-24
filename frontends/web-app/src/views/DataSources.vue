<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <div class="bg-background w-100 pa-6 rounded d-flex justify-space-between mb-6">
            <div class="d-flex justify-start">
                <v-avatar v-if="userData?.photoUrl" :image="userData.photoUrl" size="60"></v-avatar>
                <v-avatar v-else icon="mdi-account-circle" size="60" style="font-size: 2.5rem"></v-avatar>

                <div class="ml-4">
                    <p class="text-h5 text-primary mb-1">{{ userData.firstName }}'s Data Integrations</p>

                    <div class="d-flex justify-start">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <HubOutline style="width: 16px; height: 16px; margin-bottom: -3px" class="icon-secondary" />
                            {{ dataSources.length }}
                            {{ planData?.maxDataSources ? `of ${planData.maxDataSources}` : '' }} Integrations connected
                        </p>
                        <v-icon icon="mdi-circle-small" color="secondary"></v-icon>
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                            {{ dataSourceStorageUsageSum > 0 ? dataSourceStorageUsageSum.toFixed(2) : '0' }} MB of
                            {{ planData?.maxStorageMegaBytes }} MB used
                        </p>
                    </div>
                </div>
            </div>

            <div class="d-flex justify-end">
                <div class="px-6">
                    <div class="d-flex justify-center">
                        <v-progress-circular
                            :model-value="dataSourceConnectionCountPercentage ?? 0"
                            :size="50"
                            :width="5"
                            :color="usageGraphColor(dataSourceConnectionCountPercentage ?? 0)"
                        >
                            <template v-slot:default> {{ dataSourceConnectionCountPercentage }} % </template>
                        </v-progress-circular>
                    </div>
                    <div class="text-primary text-center text-caption mt-2">Integrations</div>
                </div>

                <div class="px-6">
                    <div class="d-flex justify-center">
                        <v-progress-circular
                            :model-value="dataSourceStoragePercentage"
                            :size="50"
                            :width="5"
                            :color="usageGraphColor(dataSourceStoragePercentage)"
                        >
                            <template v-slot:default> {{ dataSourceStoragePercentage }} % </template>
                        </v-progress-circular>
                    </div>
                    <div class="text-primary text-center text-caption mt-2">Storage</div>
                </div>
            </div>
        </div>

        <div v-if="isLoading.dataSourceConnections">
            <div class="d-flex justify-center">
                <v-progress-circular color="secondary" :size="80" indeterminate></v-progress-circular>
            </div>
            <div class="text-secondary text-body-1 text-center my-2">Loading integrations...</div>
        </div>

        <div v-else-if="dataSources.length === 0">
            <div class="d-flex justify-center">
                <v-icon icon="mdi-alert-circle-outline" color="secondary" style="font-size: 10rem"></v-icon>
            </div>
            <div class="d-flex justify-center">
                <div class="text-secondary text-h6 font-weight-medium text-center" style="max-width: 450px">
                    No integrations added
                </div>
            </div>
            <div class="d-flex justify-center">
                <div
                    class="text-secondary text-body-1 text-center"
                    style="max-width: 450px"
                    @click="isModalOpen = true"
                >
                    Click below to add your first
                </div>
            </div>
        </div>

        <div v-else class="d-flex flex-wrap">
            <div
                v-for="dataSource in dataSources"
                :key="dataSource.id"
                class="bg-background rounded pa-6 ma-2 grow-hover"
                style="width: 300px; position: relative"
                @click="$router.push({ name: RouteName.DATA_SOURCE_CONFIG, params: { dataSourceId: dataSource.id } })"
            >
                <div v-if="dataSource.isSyncing" class="px-2 absolute" style="right: 12px; top: 12px">
                    <IndexInProgressSpinner />
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
                    {{ dataSource.lastSync ? `Indexed ${dateToString(dataSource.lastSync)}` : 'Never indexed' }}
                </p>
                <p v-if="dataSource.nextScheduledSync" class="text-caption text-secondary">
                    <v-icon icon="mdi-calendar-star"></v-icon>
                    Next Indexing: {{ moment(dataSource.nextScheduledSync).format('M/D H:MM A') }}
                </p>
                <p v-else-if="dataSource.dataSourceLiveSyncAvailable" class="text-caption text-secondary">
                    <v-icon icon="mdi-lightning-bolt"></v-icon>
                    Real-time indexing
                </p>
                <p v-else-if="dataSource.dataSourceManualSyncAllowed" class="text-caption text-secondary">
                    <v-icon icon="mdi-cursor-default-click"></v-icon>
                    Manual indexing only
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
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../stores/dataSource';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import { dateToString, formatStringStartCase } from '../utility';
    import { RouteName } from '../types/router';
    import { useUserStore } from '../stores/user';
    import moment from 'moment';

    const dataSourceStore = useDataSourceStore();
    const { connections: dataSources, isLoading, dataSourceStorageUsageSum } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { planData, userData } = storeToRefs(userStore);

    const dataSourceConnectionCountPercentage = computed(() =>
        planData.value?.maxDataSources ? (dataSources.value.length / planData.value.maxDataSources) * 100 : null,
    );

    const dataSourceStoragePercentage = computed(() =>
        planData.value ? Math.ceil((dataSourceStorageUsageSum.value / planData.value.maxStorageMegaBytes) * 100) : 0,
    );

    const usageGraphColor = (percentage: number): string => {
        if (percentage > 85) return 'error';
        if (percentage > 70) return 'warning';
        return 'success';
    };
</script>

<style scoped>
    .sub-info-line-height {
        line-height: 23px;
    }
</style>
