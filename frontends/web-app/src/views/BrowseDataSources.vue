<template>
    <DialogModal max-width="500px" :is-open="isModalOpen" @modal-change="(open: boolean) => (isModalOpen = open)" />

    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.go(-1)"
        ></v-btn>
        <p class="text-h5 text-primary my-5 font-weight-medium">Add Data Source Integration</p>
        <div class="d-flex justify-space-between">
            <v-text-field
                clearable
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                placeholder="Search integrations..."
            ></v-text-field>
            <div class="w-50 border-primary rounded ml-4 px-4 py-2 d-flex justify-space-between">
                <div class="button-hover" :class="{ 'filter-selected': selected === 'All' }" @click="selected = 'All'">
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">All</p>
                </div>
                <div
                    class="button-hover"
                    :class="{ 'filter-selected': selected === 'Communication' }"
                    @click="selected = 'Communication'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">
                        Communication
                    </p>
                </div>
                <div
                    class="button-hover"
                    :class="{ 'filter-selected': selected === 'Project Mgmt' }"
                    @click="selected = 'Project Mgmt'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">
                        Project Mgmt
                    </p>
                </div>
                <div
                    class="button-hover"
                    :class="{ 'filter-selected': selected === 'Note Taking' }"
                    @click="selected = 'Note Taking'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">
                        Note Taking
                    </p>
                </div>
                <div
                    class="button-hover"
                    :class="{ 'filter-selected': selected === 'Other' }"
                    @click="selected = 'Other'"
                >
                    <p class="text-caption font-weight-light text-primary px-4" style="line-height: 38px">Other</p>
                </div>
            </div>
        </div>

        <div class="d-flex flex-wrap mt-6">
            <div
                v-for="option in dataSourceOptions"
                :key="option.id"
                class="ma-2 pa-6 border rounded grow-hover"
                :class="{ 'pr-12': !!option.userConnectedDataSourceId }"
                style="position: relative"
                @click="toDataSourceConfiguration(option)"
            >
                <div v-if="!!option.userConnectedDataSourceId" class="data-source-connected-badge">
                    <v-icon icon="mdi-check-bold" size="x-small" color="success"></v-icon>
                </div>
                <div class="d-flex justify-start">
                    <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${option.name}.png`" size="45"></v-avatar>
                    <div class="ml-4">
                        <p class="text-h6 text-primary">{{ formatStringStartCase(option.name) }}</p>
                        <p class="text-caption text-secondary">{{ formatStringStartCase(option.category) }}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="ml-2 mt-2 link button-hover text-secondary text-caption" @click="isModalOpen = true">
            Don't see what you're looking for?
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { onBeforeMount } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../stores/dataSource';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import { formatStringStartCase } from '../utility';
    import { DataSourceTypesResponse } from '../types/responses';
    import { useRouter } from 'vue-router';
    import { RouteName } from '../types/router';

    const selected = ref('All');
    const isModalOpen = ref(false);

    const dataSourceStore = useDataSourceStore();
    const { dataSourceOptions } = storeToRefs(dataSourceStore);

    const router = useRouter();

    onBeforeMount(async () => {
        if (!dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }
    });

    function toDataSourceConfiguration(option: DataSourceTypesResponse) {
        if (!option.userConnectedDataSourceId) {
            router.push({ name: RouteName.DATA_SOURCE_ADD, params: { dataSourceTypeId: option.id } });
        } else {
            router.push({
                name: RouteName.DATA_SOURCE_CONFIG,
                params: { dataSourceId: option.userConnectedDataSourceId },
            });
        }
    }
</script>

<style scoped>
    .filter-selected {
        background-color: rgb(var(--v-theme-background));
    }

    .data-source-connected-badge {
        background: rgba(var(--v-theme-success), 0.25);
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 3px 6px;
        border-radius: 50%;
        font-size: 12px;
    }
</style>
