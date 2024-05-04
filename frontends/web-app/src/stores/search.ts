import { defineStore } from 'pinia';
import { ref } from 'vue';
import remove from 'lodash/remove';
import { executeQuery } from '../requests/search';
import { SearchQueryParamType } from '../types/search-store';
import type { QueryParam, SearchQueryParams } from '../types/search-store';
import type { SearchResult } from '../types/responses';

export const useSearchStore = defineStore('search', () => {
    const activeQueryParams = ref<QueryParam[]>([]);
    const selectedSearchResult = ref<SearchResult | null>(null);
    const searchResults = ref<SearchResult[]>([]);
    const hasMoreResults = ref(false);
    const totalResultCount = ref(0);
    const paginationStartIndex = ref<number | null>(null);

    const executeSearchQuery = async (entityId: string): Promise<void> => {
        const searchParams: SearchQueryParams = {};
        activeQueryParams.value.forEach(({ type, value }) => {
            switch (type) {
                case SearchQueryParamType.TEXT:
                    searchParams.queryText = value as string;
                    break;
                case SearchQueryParamType.AUTHOR:
                    searchParams.authorFilters = [...(searchParams.authorFilters ?? []), value as string];
                    break;
                case SearchQueryParamType.TOPIC:
                    searchParams.topics = [...(searchParams.topics ?? []), value as string];
                    break;
                case SearchQueryParamType.SOURCE:
                    searchParams.sourceTypeFilters = [...(searchParams.sourceTypeFilters ?? []), value as string];
                    break;
                case SearchQueryParamType.DATE_LOWER:
                    searchParams.dateRangeLower = value as number;
                    break;
                case SearchQueryParamType.DATE_UPPER:
                    searchParams.dateRangeUpper = value as number;
                    break;
            }
        });

        const res = await executeQuery(searchParams, entityId);

        hasMoreResults.value = res.nextStartNdx < res.numResults;
        totalResultCount.value = res.numResults;
        paginationStartIndex.value = res.nextStartNdx;
        searchResults.value = res.results;
    };

    const selectSearchResult = (id: string): void => {
        selectedSearchResult.value = searchResults.value.find((result) => result._id === id) ?? null;
    };

    const addQueryParam = (type: SearchQueryParamType, value: string | number): void => {
        activeQueryParams.value.push({ type, value });
    };

    const removeQueryParam = (value: string | number): void => {
        remove(activeQueryParams.value, (param) => param.value === value);
    };

    return {
        activeQueryParams,
        selectedSearchResult,
        searchResults,
        hasMoreResults,
        paginationStartIndex,
        totalResultCount,
        selectSearchResult,
        addQueryParam,
        removeQueryParam,
        executeSearchQuery,
    };
});
