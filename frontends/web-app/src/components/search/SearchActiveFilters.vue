<template>
    <v-row class="d-flex justify-start mb-3">
        <div
            v-for="param in activeQueryParams"
            :key="param.value"
            class="d-flex justify-start rounded bg-background py-2 pl-2 pr-5 grow-hover ml-2 relative"
            @click="searchStore.removeQueryParam(param.value)"
        >
            <v-icon icon="mdi-close" class="filter-cancel-icon"></v-icon>
            <v-icon :icon="SEARCH_FILTER_TYPE_TO_ICON[param.type]" size="x-small"></v-icon>
            <div v-if="param.type === SearchQueryParamType.TOPIC" class="text-primary text-caption ml-1">
                {{ maxStrLenToElipse(prettyPrintTopicValue(param.value), 55) }}
            </div>
            <div v-else class="text-primary text-caption ml-1">{{ maxStrLenToElipse(param.value, 55) }}</div>
        </div>
    </v-row>
</template>

<script lang="ts" setup>
    import { SEARCH_FILTER_TYPE_TO_ICON } from '../../constants';
    import { SearchQueryParamType } from '../../types/search-store';
    import { useSearchStore } from '../../stores/search';
    import { storeToRefs } from 'pinia';
    import { maxStrLenToElipse, prettyPrintTopicValue } from '../../utility';

    const searchStore = useSearchStore();
    const { activeQueryParams } = storeToRefs(searchStore);
</script>

<style scoped>
    .filter-cancel-icon {
        top: 5px;
        right: 5px;
        position: absolute;
        font-size: 12px;
    }
</style>
