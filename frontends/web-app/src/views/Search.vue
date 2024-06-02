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

            <div v-if="!searchResults.length && isLoading.searchResults" class="mt-14">
                <div class="d-flex justify-center">
                    <v-progress-circular color="secondary" :size="80" indeterminate></v-progress-circular>
                </div>
                <div class="text-secondary text-body-1 text-center my-2">Loading results...</div>
            </div>

            <div style="height: 78.8vh; overflow-y: scroll" ref="searchResultScrollContainer">
                <SearchResultRow
                    v-for="result in searchResults"
                    :key="result._id"
                    :id="result._id"
                    :source-type="result.dataSourceType"
                    :timestamp="result.createdAt"
                    :title="result.title"
                    :body="result.text"
                    :url="result.url"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
    import { useSearchStore } from '../stores/search';
    import { useDataSourceStore } from '../stores/dataSource';
    import { useUserStore } from '../stores/user';
    import { storeToRefs } from 'pinia';
    import debounce from 'lodash/debounce';

    const searchStore = useSearchStore();
    const {
        activeQueryParams,
        searchResults,
        totalResultCount,
        hasMoreResults,
        isLoading,
        searchResultsLastScrollPosition,
    } = storeToRefs(searchStore);

    const dataSourceStore = useDataSourceStore();
    const { dataSourceOptions } = storeToRefs(dataSourceStore);

    const userStore = useUserStore();
    const { userEntityId } = storeToRefs(userStore);

    const searchResultScrollContainer = ref<HTMLElement | null>(null);
    const searchIsFocused = ref(false);

    onBeforeMount(async () => {
        if (!dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }
    });

    onMounted(() => {
        if (searchResultsLastScrollPosition.value && searchResultScrollContainer.value) {
            searchResultScrollContainer.value.scrollTop = searchResultsLastScrollPosition.value;
        }
    });

    watchEffect(() => {
        if (searchResultScrollContainer.value) {
            searchResultScrollContainer.value.addEventListener('scroll', debounce(onScroll, 100));
        }
    });

    onBeforeUnmount(() => {
        if (searchResultScrollContainer.value) {
            searchResultScrollContainer.value.removeEventListener('scroll', debounce(onScroll, 100));
        }
    });

    const isSearchStarted = computed(() => activeQueryParams.value.length > 0);

    const searchColumnWith = computed(() => {
        if (isSearchStarted.value && !searchIsFocused.value) return '4';
        if (isSearchStarted.value && searchIsFocused.value) return '8';
        return '12';
    });

    /**
     * Scroll based pagination handler
     */
    const onScroll = () => {
        searchResultsLastScrollPosition.value = searchResultScrollContainer.value?.scrollTop ?? null;

        if (
            (searchResultScrollContainer.value?.scrollHeight ?? 0) * 0.75 -
                (searchResultScrollContainer.value?.scrollTop ?? 0) <
                0 &&
            hasMoreResults.value &&
            !isLoading.value.searchResults
        ) {
            searchStore.executeSearchQuery(userEntityId.value);
        }
    };
</script>
