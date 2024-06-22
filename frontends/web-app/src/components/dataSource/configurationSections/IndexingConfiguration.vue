<template>
    <v-sheet class="border-primary rounded pa-6" style="height: 302px">
        <p class="text-h6 text-primary font-weight-medium">Indexing configuration</p>
        <p class="text-caption text-secondary" style="max-width: 250px">
            Configure the interval upon which your content is indexed
        </p>

        <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">Update Interval</p>
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
                :disabled="!syncPreferenceChanged"
                >Update Preference</v-btn
            >
        </div>
    </v-sheet>
</template>

<script setup lang="ts">
    import { storeToRefs } from 'pinia';
    import { useUserStore } from '../../../stores/user';
    import { DataSyncInterval } from '../../../types/responses';
    import { computed, onMounted, ref, watch } from 'vue';
    import { useToast } from 'vue-toastification';
    import { useDataSourceStore } from '../../../stores/dataSource';
    import { IndexingIntervalOptions } from '../../../constants/dataSourceConfiguration';

    const toast = useToast();

    const userStore = useUserStore();
    const { planData } = storeToRefs(userStore);

    const dataSourceStore = useDataSourceStore();
    const { isLoading, currentConfiguring } = storeToRefs(dataSourceStore);

    const selectedIndexingOption = ref<DataSyncInterval>();

    onMounted(() => {
        selectedIndexingOption.value = currentConfiguring.value?.selectedSyncInterval;
    });

    watch(currentConfiguring, (newVal) => {
        selectedIndexingOption.value = newVal?.selectedSyncInterval;
    });

    const syncPreferenceChanged = computed(
        () => selectedIndexingOption.value !== currentConfiguring.value?.selectedSyncInterval,
    );

    const maxPlanIntervalLevel = computed(
        () => IndexingIntervalOptions[planData.value?.dataSyncInterval || DataSyncInterval.WEEKLY].level,
    );

    const onIndexingIntervalSelection = (value: DataSyncInterval) => {
        if (maxPlanIntervalLevel.value < IndexingIntervalOptions[value].level) {
            toast.warning('Please upgrade plan to unlock this feature.');
            return;
        }

        selectedIndexingOption.value = value;
    };

    const commitIndexingSelection = async () => {
        const success = await dataSourceStore.commitDataSourceConnectionUpdate(selectedIndexingOption.value!);

        if (success) {
            toast.success('Indexing interval updates!');
        }
    };
</script>

<style scoped>
    .body-action-btn {
        width: 200px;
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
