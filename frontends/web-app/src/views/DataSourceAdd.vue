<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6 relative">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded absolute"
            variant="tonal"
            style="width: 40px; height: 40px; left: 20px; top: 20px"
            @click="onBackToBrowse"
        ></v-btn>

        <div class="d-flex justify-space-between steps-container">
            <div v-for="(step, ndx) in steps" :key="step">
                <div
                    class="d-flex justify-center py-2 rounded-xl"
                    :class="{ selected: ndx === currentStep }"
                    style="width: 6rem"
                >
                    <div class="mr-4 text-body-2 text-primary font-weight-medium step-number">
                        {{ ndx + 1 }}
                    </div>

                    <div class="text-body-2 text-primary font-weight-medium" style="margin-left: -10px">
                        {{ step }}
                    </div>
                </div>
            </div>
        </div>

        <div class="form-container mt-10 d-flex flex-column">
            <div v-if="currentStep === 0">
                <div class="text-h4 text-primary font-weight-medium text-center">Access management</div>
                <div class="text-body-1 text-primary text-center mb-8">
                    Your credentials are used to connect to and index the data source
                </div>

                <div class="text-body-1 text-primary font-weight-bold">1. Instructions</div>
                <div class="text-body-2 text-secondary">
                    Click below to view {{ formatStringStartCase(selectedDataSourceOption?.name ?? '') }} setup
                    instructions
                </div>
                <v-btn
                    class="mt-2"
                    color="blue"
                    prepend-icon="mdi-open-in-new"
                    variant="tonal"
                    style="min-width: 20rem"
                    @click="onOpenInstructions(selectedDataSourceOption?.name)"
                >
                    View {{ formatStringStartCase(selectedDataSourceOption?.name ?? '') }} instructions
                </v-btn>

                <div class="text-body-1 text-primary font-weight-bold mt-6">2. Credentials</div>

                <p class="mt-2 text-body-2 font-weight-medium text-primary">API Key</p>
                <v-text-field
                    type="password"
                    placeholder="****************"
                    variant="outlined"
                    v-model="apiKeyInput"
                ></v-text-field>
            </div>

            <div v-else-if="currentStep === 1">
                <div class="text-h4 text-primary font-weight-medium text-center">Indexing frequency</div>
                <div class="text-body-1 text-primary text-center mb-8">
                    Within the confines of your current plan, you may adjust the frequency with which the integration is
                    indexed
                </div>

                <div class="text-body-1 text-primary font-weight-bold mb-2">Set Interval</div>
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

                <div class="text-body-1 text-primary font-weight-bold mt-6">Backfill cutoff date</div>
                <div class="text-body-2 text-secondary mb-2" style="max-width: 400px">
                    Set earliest date for which historical data will be indexed, or leave empty for all-time
                </div>
                <v-text-field
                    variant="outlined"
                    type="date"
                    style="max-width: 200px"
                    v-model="backfillDate"
                ></v-text-field>
            </div>

            <div v-else>
                <div class="text-h4 text-primary font-weight-medium text-center">Additional configurations</div>
                <div class="text-body-1 text-primary text-center mb-8">
                    Optionally fine tune different aspects of your integration's behavior
                </div>

                <div
                    v-for="[optionName, configOption] in Object.entries(
                        selectedDataSourceOption?.additionalConfigTemplate ?? {},
                    )"
                >
                    <div class="text-body-1 text-primary font-weight-bold mt-6">{{ configOption.displayName }}</div>
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
            </div>

            <div class="mt-auto">
                <div class="d-flex">
                    <v-btn class="w-50" color="secondary" @click="onBack">
                        {{ currentStep !== 0 ? 'back' : 'cancel' }}
                    </v-btn>
                    <v-btn
                        class="w-50 ml-2"
                        color="blue"
                        @click="onNext"
                        :loading="isLoading.connectionTest || isLoading.createDataSource"
                    >
                        {{ currentStep !== 2 ? 'next step' : 'finish setup' }}
                    </v-btn>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { computed, onMounted, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { RouteName } from '../types/router';
    import { formatStringStartCase } from '../utility';
    import { KnowledgeBaseMap } from '../constants/knowledgeBase';
    import { useDataSourceStore } from '../stores/dataSource';
    import { storeToRefs } from 'pinia';
    import { DataSourceTypesResponse, DataSyncInterval } from '../types/responses';
    import { useToast } from 'vue-toastification';
    import { IndexingIntervalOptions } from '../constants/dataSourceConfiguration';
    import { useUserStore } from '../stores/user';

    const route = useRoute();
    const router = useRouter();

    const toast = useToast();

    const dataSourceStore = useDataSourceStore();
    const { dataSourceOptions, isLoading } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { planData, userEntityId } = storeToRefs(userStore);

    const steps = ['Auth', 'Indexing', 'Options'];

    const currentStep = ref<number>(0);
    const apiKeyInput = ref<string>();
    const selectedDataSourceOption = ref<DataSourceTypesResponse>();
    const selectedIndexingOption = ref<DataSyncInterval>();
    const backfillDate = ref();
    const additionalConfiguration = ref({});

    onMounted(async () => {
        if (!dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }

        selectedDataSourceOption.value = dataSourceOptions.value.find(
            (option) => option.id === route.params.dataSourceTypeId,
        );

        if (!selectedDataSourceOption.value) {
            toast.error('Data source type not found');
            onBackToBrowse();
        }

        additionalConfiguration.value = Object.fromEntries(
            Object.entries(selectedDataSourceOption.value?.additionalConfigTemplate).map(([property, data]: any) => [
                property,
                data.default,
            ]),
        );
    });

    const maxPlanIntervalLevel = computed(
        () => IndexingIntervalOptions[planData.value?.dataSyncInterval || DataSyncInterval.WEEKLY].level,
    );

    const onBack = () => {
        if (currentStep.value > 0) {
            currentStep.value -= 1;
        } else {
            onBackToBrowse();
        }
    };

    const onAuthNext = async () => {
        if (!apiKeyInput.value) {
            toast.error('Missing API Key');
            return;
        }
        const res = await dataSourceStore.testDataSourceCredential(
            selectedDataSourceOption.value!.name,
            apiKeyInput.value,
        );

        if (!res.isValid) {
            toast.error(res.message);
            return;
        }

        toast.success('Credentials validated');
        currentStep.value += 1;
    };

    const onIndexingNext = () => {
        if (!selectedIndexingOption.value) {
            toast.error('Please select an indexing frequency option');
            return;
        }

        currentStep.value += 1;
    };

    const onFinalNext = async () => {
        await dataSourceStore.createDataSourceConnection({
            dataSourceTypeId: selectedDataSourceOption.value!.id,
            ownerEntityId: userEntityId.value,
            secret: apiKeyInput.value!,
            selectedSyncInterval: selectedIndexingOption.value!,
            backfillHistoricalStartDate: backfillDate.value ? new Date(backfillDate.value).toISOString() : undefined,
            additionalConfiguration: additionalConfiguration.value,
        });
        onBackToBrowse();
    };

    const onNext = async () => {
        if (currentStep.value === 0) {
            await onAuthNext();
        } else if (currentStep.value === 1) {
            onIndexingNext();
        } else {
            await onFinalNext();
        }
    };

    const onBackToBrowse = () => {
        router.push({ name: RouteName.BROWSE_DATA_SOURCES });
    };

    const onOpenInstructions = (name: string) => {
        window.open(KnowledgeBaseMap[name].auth, '_blank')!.focus();
    };

    const onIndexingIntervalSelection = (value: DataSyncInterval) => {
        if (maxPlanIntervalLevel.value < IndexingIntervalOptions[value].level) {
            toast.warning('Please upgrade plan to unlock this feature.');
            return;
        }

        selectedIndexingOption.value = value;
    };
</script>

<style scoped>
    .steps-container {
        width: 20rem;
        margin: auto;
    }

    .form-container {
        max-width: 600px;
        margin: auto;
        height: 77vh;
    }

    .selected {
        background-color: rgba(var(--v-theme-success), 0.5);
    }

    .selected > .step-number {
        background: rgba(var(--v-theme-surface-bright), 0.35);
    }

    .step-number {
        background: rgb(var(--v-theme-surface-bright));
        border-radius: 50%;
        width: 18px;
        text-align: center;
    }

    .filter-selected {
        background-color: rgb(var(--v-theme-background));
    }

    .disabled {
        font-weight: normal !important;
        filter: brightness(100%) !important;
        cursor: not-allowed !important;
        color: rgb(var(--v-theme-secondary)) !important;
    }
</style>
