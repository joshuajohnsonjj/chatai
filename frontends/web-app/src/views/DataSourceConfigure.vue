<template>
    <div class="bg-surface w-100 rounded-xl pa-6 scroll-container">
        <div class="bg-background w-100 pa-6 rounded mb-6 mt-4 d-flex">
            <v-btn
                icon="mdi-arrow-left"
                class="rounded"
                density="compact"
                variant="tonal"
                @click="$router.push({ name: RouteName.DATA_SOURCES })"
            ></v-btn>

            <div class="d-flex justify-start ml-4">
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
                            <IndexInProgressSpinner />
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
                            (currentConfiguring?.mbStorageEstimate ?? 0) > 0
                                ? currentConfiguring?.mbStorageEstimate.toFixed(2)
                                : '0'
                        }}
                        MB stored
                    </p>
                </div>
            </div>

            <div style="width: 250px" class="ml-auto">
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
                    <div class="d-flex flex-column">
                        <p class="text-h6 text-primary font-weight-medium">Additional configurations</p>

                        <div
                            v-for="[optionName, configOption] in Object.entries(
                                dataSourceTypeConfigurationTemplate ?? {},
                            )"
                        >
                            <div class="text-body-1 text-primary font-weight-bold mt-6">
                                {{ configOption.displayName }}
                            </div>
                            <div class="text-body-2 text-secondary" style="max-width: 400px">
                                {{ configOption.description }}
                            </div>

                            <div v-if="configOption.type === 'BOOLEAN'">
                                <v-switch
                                    v-model="additionalConfiguration[optionName]"
                                    color="info"
                                    :label="additionalConfiguration[optionName] ? 'Enabled' : 'Disabled'"
                                ></v-switch>
                            </div>
                        </div>

                        <div class="mt-auto d-flex justify-end">
                            <v-btn
                                class="body-action-btn"
                                color="blue"
                                variant="tonal"
                                :disabled="!isChangedConfig"
                                :loading="isLoading.connectionUpdate"
                                @click="onUpdateConfig"
                                >Update Config</v-btn
                            >
                        </div>
                    </div>
                </v-sheet>

                <v-btn
                    class="text-caption mt-4"
                    color="warning"
                    prepend-icon="mdi-trash-can"
                    variant="plain"
                    @click="showCofirmRemovalModal = true"
                    >Remove integration</v-btn
                >
            </v-col>
        </v-row>
    </div>

    <ConfirmModal
        v-if="showCofirmRemovalModal"
        title="Permanently delete integration?"
        sub-title="All data associated will be erased. This action is irreversible."
        button-theme="warning"
        @confirmed="() => {}"
        @close-modal="showCofirmRemovalModal = false"
    />
</template>

<script lang="ts" setup>
    import { onBeforeMount, ref, computed } from 'vue';
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
    const { connections, isLoading, currentConfiguring, dataSourceOptions } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { userEntityId } = storeToRefs(userStore);

    const searchStore = useSearchStore();

    const showCofirmRemovalModal = ref(false);
    const additionalConfiguration = ref({});
    const dataSourceTypeConfigurationTemplate = ref();

    onBeforeMount(async () => {
        if (!connections.value.length || !dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }

        dataSourceStore.setCurrentConfiguring(route.params.dataSourceId as string);

        if (route.query.a && route.query.r) {
            await dataSourceStore.updateOAuthCredentials(route.query.a as string, route.query.r as string);
            router.replace({ query: {} });
        }

        dataSourceTypeConfigurationTemplate.value = dataSourceOptions.value.find(
            (opt) => opt.id === currentConfiguring.value.dataSourceTypeId,
        ).additionalConfigTemplate;

        additionalConfiguration.value = Object.fromEntries(
            Object.entries(dataSourceTypeConfigurationTemplate.value).map(([property, data]: any) => [
                property,
                currentConfiguring.value.additionalConfig[property],
            ]),
        );
    });

    const isChangedConfig = computed(() =>
        Object.entries(additionalConfiguration.value).some(
            ([property, value]) =>
                currentConfiguring.value?.additionalConfig &&
                currentConfiguring.value.additionalConfig[property] !== value,
        ),
    );

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

    const onUpdateConfig = async () => {
        const success = await dataSourceStore.commitDataSourceConnectionUpdate({
            additionalConfig: additionalConfiguration.value!,
        });

        if (success) {
            toast.success('Configuration updated!');
        }
    };
</script>

<style scoped>
    .body-action-btn {
        width: 200px;
    }

    .scroll-container {
        overflow-y: scroll;
        height: 96vh;
    }
</style>
