<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.go(-1)"
        ></v-btn>

        <div class="bg-background w-100 pa-6 rounded mb-6 mt-4 d-flex justify-space-between">
            <div class="d-flex justify-start">
                <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${sourceData.name}.png`" size="80"></v-avatar>
                <div class="ml-4">
                    <div class="d-flex justify-start">
                        <p v-if="!isAddNew" class="text-h5 text-primary mb-1 font-weight-medium">
                            {{ formatStringStartCase(sourceData.name ?? '') }} Integration Details
                        </p>
                        <p v-else class="text-h5 text-primary mb-1 font-weight-medium">
                            Add {{ formatStringStartCase(sourceData.name ?? '') }} Integration
                        </p>

                        <HelpBox
                            class="icon-primary grow-hover button-hover ml-2 pb-6"
                            style="width: 15px"
                            @click="openDocs"
                        />

                        <div v-if="sourceData.isSyncing" class="px-2">
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

                    <div v-if="!isAddNew">
                        <div class="d-flex justify-start">
                            <p class="text-caption text-secondary sub-info-line-height">
                                <v-icon icon="mdi-calendar-star" color="secondary"></v-icon>
                                Next index {{ moment(sourceData.nextScheduledSync).format('M/D H:MM A') }}
                            </p>
                            <v-icon icon="mdi-circle-small" color="secondary"></v-icon>
                            <p class="text-caption text-secondary sub-info-line-height">
                                <v-icon icon="mdi-calendar-blank" color="secondary"></v-icon>
                                Linked since {{ moment(sourceData.createdAt).format('M/D/YYYY') }}
                            </p>
                        </div>

                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                            {{ sourceData.storage > 0 ? sourceData.storage.toFixed(2) : '0' }} MB stored
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="!isAddNew" style="width: 250px">
                <v-btn
                    class="w-100 mb-2"
                    color="info"
                    prepend-icon="mdi-eye"
                    variant="tonal"
                    @click="redirectToSourceDataView"
                    >View data</v-btn
                >
                <v-btn
                    v-if="sourceData.dataSourceManualSyncAllowed && !sourceData.isSyncing"
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
                <v-sheet class="border-primary rounded pa-6">
                    <div class="d-flex justify-start">
                        <p class="text-h6 text-primary font-weight-medium">Access management</p>
                        <HelpBox
                            class="icon-primary grow-hover button-hover ml-2 pb-6"
                            style="width: 12px"
                            @click="openAuthDocs"
                        />
                    </div>
                    <p class="text-caption text-secondary" style="max-width: 250px">
                        Your credentials are used to connect to and synchronize the data source
                    </p>

                    <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">
                        {{ isAddNew ? 'Add' : 'Update' }} API Key
                    </p>
                    <v-text-field
                        type="password"
                        placeholder="****************"
                        variant="outlined"
                        v-model="apiKeyInput"
                    ></v-text-field>

                    <div class="d-flex justify-end mt-4">
                        <v-btn
                            class="body-action-btn"
                            variant="plain"
                            :loading="isLoading.connectionTest"
                            @click="onTestConnection"
                            >Test connection</v-btn
                        >
                        <v-btn class="body-action-btn" color="blue" variant="tonal"
                            >{{ isAddNew ? 'Set' : 'Update' }} Key</v-btn
                        >
                    </div>
                </v-sheet>
            </v-col>
            <v-col cols="6">
                <v-sheet class="border-primary rounded pa-6">
                    <p class="text-h6 text-primary font-weight-medium">Indexing configuration</p>
                    <p class="text-caption text-secondary" style="max-width: 250px">
                        Configure the interval upon which your content is indexed
                    </p>

                    <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">
                        {{ isAddNew ? 'Set' : 'Update' }} Interval
                    </p>
                    <div class="border-primary rounded px-4 py-2 d-flex justify-space-between">
                        <div
                            v-for="option in Object.values(IndexingIntervalOptions)"
                            :key="option.value"
                            class="button-hover"
                            :class="{
                                'filter-selected': selectedIndexingOption === option.value,
                                disabled: maxPlanIntervalLevel < option.level,
                            }"
                            @click="onIndexingIntervalSelection(option.value)"
                        >
                            <p
                                class="text-caption font-weight-light px-4"
                                :class="{ 'text-primary': maxPlanIntervalLevel >= option.level }"
                                style="line-height: 38px"
                            >
                                {{ option.text }}
                            </p>
                        </div>
                    </div>

                    <div class="d-flex justify-end mt-4">
                        <v-btn
                            color="blue"
                            variant="tonal"
                            class="body-action-btn"
                            @click="commitIndexingSelection"
                            :loading="isLoading.indexingIntervalUpdate"
                            >{{ isAddNew ? 'Save' : 'Update' }} Preference</v-btn
                        >
                    </div>
                </v-sheet>
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
    import { computed, onBeforeMount, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../../stores/dataSource';
    import { useUserStore } from '../../stores/user';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../../constants';
    import { formatStringStartCase } from '../../utility';
    import find from 'lodash/find';
    import { useRoute, useRouter } from 'vue-router';
    import moment from 'moment';
    import { useToast } from 'vue-toastification';
    import { KnowledgeBaseMap } from '../../constants/knowledgeBase';
    import { IndexingIntervalOptions, DataSyncInterval } from '../../constants/dataSourceConfiguration';
    import { RouteName } from '../../types/router';
    import { SearchQueryParamType } from '../../types/search-store';
    import { useSearchStore } from '../../stores/search';
    import { DataSourceTypeName } from '../../types/responses';

    const props = defineProps<{
        isAddNew: boolean;
    }>();

    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    const dataSourceStore = useDataSourceStore();
    const { connections, dataSourceOptions, isLoading } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { userData, userEntityId, planData } = storeToRefs(userStore);

    const searchStore = useSearchStore();

    const apiKeyInput = ref<string>('');
    const selectedIndexingOption = ref<DataSyncInterval>();

    onBeforeMount(async () => {
        if (!props.isAddNew) {
            if (!connections.value.length) {
                await dataSourceStore.retreiveConnections();
            }

            const source = find(connections.value, (option) => option.id === route.params.dataSourceId);
            selectedIndexingOption.value = source!.selectedSyncInterval;
        } else if (props.isAddNew && !dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }
    });

    const maxPlanIntervalLevel = computed(
        () => IndexingIntervalOptions[planData.value?.dataSyncInterval || DataSyncInterval.WEEKLY].level,
    );

    const sourceData = computed(() => {
        if (props.isAddNew) {
            const sourceType = find(dataSourceOptions.value, (option) => option.id === route.params.dataSourceTypeId);
            return {
                name: sourceType?.name,
                dataSourceTypeId: route.params.dataSourceTypeId,
            };
        } else {
            const source = find(connections.value, (option) => option.id === route.params.dataSourceId);
            return {
                id: source?.id,
                name: source?.dataSourceName,
                createdAt: source?.createdAt,
                dataSourceTypeId: source?.dataSourceTypeId,
                storage: source?.mbStorageEstimate,
                nextScheduledSync: source?.nextScheduledSync,
                dataSourceManualSyncAllowed: source?.dataSourceManualSyncAllowed,
                isSyncing: source?.isSyncing,
            };
        }
    });

    const indexNow = async () => {
        switch (sourceData.value.name) {
            case DataSourceTypeName.GOOGLE_DRIVE:
                return await dataSourceStore.initiateGoogleDriveSync(sourceData.value.id!);
            default:
                toast.error('Manual indexing not allowed for this integration');
        }
    };

    const redirectToSourceDataView = () => {
        searchStore.clearQueryParams();
        searchStore.addQueryParam(SearchQueryParamType.SOURCE, sourceData.value.name!);
        searchStore.executeSearchQuery(userEntityId.value);

        router.push({ name: RouteName.SEARCH });
    };

    const onIndexingIntervalSelection = (value: DataSyncInterval) => {
        if (maxPlanIntervalLevel.value < IndexingIntervalOptions[value].level) {
            toast.warning('Please upgrade plan to unlock this feature.');
            return;
        }

        selectedIndexingOption.value = value;
    };

    const commitIndexingSelection = async () => {
        const success = await dataSourceStore.commitDataSourceConnectionUpdate(
            route.params.dataSourceId as string,
            userData.value!.type,
            selectedIndexingOption.value!,
        );

        if (success) {
            toast.success('Indexing interval updates!');
        }
    };

    const onTestConnection = async () => {
        if (apiKeyInput.value.length < 5) {
            toast.error('Invalid token');
            return;
        }

        const result = await dataSourceStore.testDataSourceCredential(
            sourceData.value.dataSourceTypeId as string,
            userEntityId.value,
            userData.value!.type,
            apiKeyInput.value,
        );

        if (result.isValid) {
            toast.success('Credential valid!');
        } else {
            toast.error(result.message);
        }
    };

    const openDocs = () => window.open(KnowledgeBaseMap[sourceData.value.name as string].root, '_blank')!.focus();

    const openAuthDocs = () => window.open(KnowledgeBaseMap[sourceData.value.name as string].auth, '_blank')!.focus();
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
