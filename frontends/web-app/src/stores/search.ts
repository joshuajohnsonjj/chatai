import { defineStore } from 'pinia';
import { ref } from 'vue';
import remove from 'lodash/remove';
import {
    deleteSearchResultById,
    executeQuery,
    getAuthorSuggestions,
    getSearchResultById,
    getTopicSuggestions,
} from '../requests/search';
import { SearchQueryParamType } from '../types/search-store';
import type { CurrentSearchSuggestions, QueryParam, SearchQueryParams } from '../types/search-store';
import type { DataSourceTypesResponse, SearchResult } from '../types/responses';
import { autocompleteSearch } from '../utility';
import { useDataSourceStore } from './dataSource';

export const useSearchStore = defineStore('search', () => {
    const searchSuggestions = ref<CurrentSearchSuggestions>([]);
    const topicFilterOptions = ref<string[]>([]);
    const authorFilterOptions = ref<string[]>([]);

    const activeQueryParams = ref<QueryParam[]>([]);

    const selectedSearchResult = ref<SearchResult | null>(null);
    const searchResults = ref<SearchResult[]>([]);
    const hasMoreResults = ref(false);
    const totalResultCount = ref(0);
    const paginationStartIndex = ref<number | null>(null);
    const searchResultsLastScrollPosition = ref<number | null>(null);

    const isLoading = ref({
        searchResults: false,
        allSearchSuggestions: false,
        topicSuggestions: false,
        authorSuggestions: false,
        deleteResult: false,
    });

    const executeSearchQuery = async (entityId: string) => {
        isLoading.value.searchResults = true;

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
                case SearchQueryParamType.CATEGORY:
                    searchParams.sourceTypeFilters = [
                        ...(searchParams.sourceTypeFilters ?? []),
                        ...useDataSourceStore().dataSourceCategoryToOptionsMap[value],
                    ];
                    break;
                case SearchQueryParamType.DATE_LOWER:
                    searchParams.dateRangeLower = new Date(value).getTime();
                    break;
                case SearchQueryParamType.DATE_UPPER:
                    searchParams.dateRangeUpper = new Date(value).getTime();
                    break;
            }
        });

        try {
            const res = await executeQuery(searchParams, entityId, paginationStartIndex.value);

            hasMoreResults.value = res.nextStartNdx < res.numResults;
            totalResultCount.value = res.numResults;
            paginationStartIndex.value = res.nextStartNdx;
            searchResults.value.push(...res.results);
        } finally {
            isLoading.value.searchResults = false;
        }
    };

    const resetSearchResults = () => {
        searchResults.value = [];
        searchResultsLastScrollPosition.value = null;
    };

    const getFilterTopicOptions = async (entityId: string, input?: string) => {
        isLoading.value.topicSuggestions = true;

        try {
            const topicRes = await getTopicSuggestions(entityId, input);
            topicFilterOptions.value = topicRes.results.map((result) => result.value);
        } finally {
            isLoading.value.topicSuggestions = false;
        }
    };

    const getFilterAuthorOptions = async (entityId: string, input?: string) => {
        isLoading.value.authorSuggestions = true;

        try {
            const authorsRes = await getAuthorSuggestions(entityId, input);
            authorFilterOptions.value = authorsRes.results.map((result) => result.value);
        } finally {
            isLoading.value.authorSuggestions = false;
        }
    };

    const getSearchSuggestions = async (
        input: string,
        entityId: string,
        dataSourceOptions: DataSourceTypesResponse[],
    ) => {
        isLoading.value.allSearchSuggestions = true;

        try {
            const topicRes = await getTopicSuggestions(entityId, input);
            const authorsRes = await getAuthorSuggestions(entityId, input);
            const sourcesRes = autocompleteSearch(
                input,
                dataSourceOptions.map((opt) => opt.name),
            );

            searchSuggestions.value = [
                ...topicRes.results,
                ...authorsRes.results,
                ...sourcesRes.map((source) => ({ type: SearchQueryParamType.SOURCE, value: source })),
            ];
        } finally {
            isLoading.value.allSearchSuggestions = false;
        }
    };

    const selectSearchResult = (id: string) => {
        selectedSearchResult.value = searchResults.value.find((result) => result._id === id) ?? null;
    };

    const loadSearchResult = async (resultId: string) => {
        selectedSearchResult.value = await getSearchResultById(resultId);
    };

    const addQueryParam = (type: SearchQueryParamType, value: string | number) => {
        if (type === SearchQueryParamType.TEXT) {
            remove(activeQueryParams.value, (param) => param.type === SearchQueryParamType.TEXT);
            resetSearchResults();
            activeQueryParams.value = [{ type, value }, ...activeQueryParams.value];
        } else {
            activeQueryParams.value.push({ type, value });
        }
    };

    const removeQueryParam = (value: string | number, entityId: string) => {
        remove(activeQueryParams.value, (param) => param.value === value);
        resetSearchResults();

        if (activeQueryParams.value.length > 0) {
            executeSearchQuery(entityId);
        }
    };

    const clearQueryParams = () => {
        activeQueryParams.value = [];
        resetSearchResults();
    };

    const deleteSearchResult = async (resultId: string): Promise<boolean> => {
        let deleted = false;
        isLoading.value.deleteResult = true;

        try {
            const { deletedCount } = await deleteSearchResultById(resultId);

            if (deletedCount !== 0) {
                searchResults.value.splice(
                    searchResults.value.findIndex((res) => res._id === resultId),
                    1,
                );
                deleted = true;
            }
        } finally {
            isLoading.value.deleteResult = false;
        }

        return deleted;
    };

    return {
        activeQueryParams,
        selectedSearchResult,
        searchResults,
        hasMoreResults,
        paginationStartIndex,
        totalResultCount,
        searchSuggestions,
        topicFilterOptions,
        authorFilterOptions,
        isLoading,
        searchResultsLastScrollPosition,
        selectSearchResult,
        addQueryParam,
        removeQueryParam,
        executeSearchQuery,
        getSearchSuggestions,
        loadSearchResult,
        getFilterTopicOptions,
        getFilterAuthorOptions,
        clearQueryParams,
        deleteSearchResult,
    };
});
