<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6 mt-3">
        <v-row>
            <v-col :cols="isSearchStarted ? '1' : '12'" class="d-flex justify-center">
                <img
                    src="../assets/orb.gif"
                    :width="isSearchStarted ? '90' : '300'"
                    style="z-index: 100; height: fit-content"
                />
            </v-col>
            <v-col
                :cols="searchColumnWith"
                class="d-flex"
                :class="{ 'justify-center': !isSearchStarted, 'pt-6': isSearchStarted }"
            >
                <SearchBarWithPredictions
                    placeholder="Search something..."
                    width="600px"
                    @focus-change="(isFocused: boolean) => (searchIsFocused = isFocused)"
                />
            </v-col>
            <v-col
                v-if="!searchIsFocused"
                :cols="isSearchStarted ? '7' : '12'"
                class="d-flex"
                :class="{ 'justify-center': !isSearchStarted, 'pt-6': isSearchStarted }"
            >
                <SearchFilters />
            </v-col>
        </v-row>

        <div v-if="isSearchStarted" class="mt-4">
            <div class="d-flex justify-space-between">
                <SearchActiveFilters />

                <div class="text-secondary text-body-2">{{ totalResultCount }} results</div>
            </div>
            <HorizontalLine thinkness="3px" />

            <div style="height: 76.8vh; overflow-y: scroll">
                <SearchResultRow
                    v-for="result in searchResults"
                    :key="result._id"
                    :id="result._id"
                    :source-type="result.dataSourceType"
                    :timestamp="result.createdAt"
                    :title="result.text.substring(12, result.text.indexOf(', Page Excerpt:'))"
                    :body="result.text.substring(result.text.indexOf('Page Excerpt: ') + 14)"
                    :url="result.url"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { computed, onBeforeMount, ref } from 'vue';
    import { useSearchStore } from '../stores/search';
    import { useDataSourceStore } from '../stores/dataSource';
    import { storeToRefs } from 'pinia';

    const searchStore = useSearchStore();
    const { activeQueryParams, searchResults, totalResultCount } = storeToRefs(searchStore);
    const dataSourceStore = useDataSourceStore();
    const { dataSourceOptions } = storeToRefs(dataSourceStore);

    onBeforeMount(async () => {
        if (!dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }
    });

    const searchIsFocused = ref(false);

    const isSearchStarted = computed(() => activeQueryParams.value.length > 0);
    const searchColumnWith = computed(() => {
        if (isSearchStarted.value && !searchIsFocused.value) return '4';
        if (isSearchStarted.value && searchIsFocused.value) return '8';
        return '12';
    });
</script>
