<template>
    <div class="d-flex justify-start">
        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-cloud-outline"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Source
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter
                    search-placeholder="Search sources..."
                    :is-local-search="true"
                    :options="dataSourceOptions.map((source: DataSourceTypesResponse) => source.name)"
                    :type="SearchQueryParamType.SOURCE"
                />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-shape-outline"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Category
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter
                    search-placeholder="Search categories..."
                    :is-local-search="true"
                    :options="Object.keys(dataSourceCategoryToOptionsMap)"
                    :type="SearchQueryParamType.CATEGORY"
                />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-account-group-outline"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Person
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter
                    search-placeholder="Search people..."
                    :is-local-search="false"
                    :options="[]"
                    :type="SearchQueryParamType.AUTHOR"
                />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-pound"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Topic
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter
                    search-placeholder="Search topics..."
                    :is-local-search="false"
                    :options="topicFilterOptions"
                    :type="SearchQueryParamType.TOPIC"
                />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-calendar-range"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Date Range
            </v-btn>

            <template #popper>
                <CalendarRangeFilter />
            </template>
        </VDropdown>
    </div>
</template>

<script lang="ts" setup>
    import { useDataSourceStore } from '../../stores/dataSource';
    import { storeToRefs } from 'pinia';
    import { DataSourceTypesResponse } from '../../types/responses';
    import { SearchQueryParamType } from '../../types/search-store';
    import { onBeforeMount } from 'vue';
    import { useSearchStore } from '../../stores/search';
    import { useUserStore } from '../../stores/user';

    const dataSourceStore = useDataSourceStore();
    const { dataSourceOptions, dataSourceCategoryToOptionsMap } = storeToRefs(dataSourceStore);
    const searchStore = useSearchStore();
    const { topicFilterOptions } = storeToRefs(searchStore);
    const userStore = useUserStore();
    const { userEntityId } = storeToRefs(userStore);

    onBeforeMount(async () => {
        if (!topicFilterOptions.value.length) {
            await searchStore.getFilterTopicOptions(userEntityId.value);
        }
    });
</script>
