<template>
    <FullScreenBackgroundBlur
        v-if="isFocused"
        @click="
            isFocused = false;
            $emit('focusChange');
        "
    />

    <div :style="`width: ${width}`" style="z-index: 100; position: relative">
        <div id="searchInputContainer" class="border-primary w-100 rounded" :class="{ focused: isFocused }">
            <v-text-field
                id="search"
                prepend-inner-icon="mdi-magnify"
                :append-inner-icon="isFocused ? 'mdi-close' : ''"
                variant="solo"
                hide-details
                v-model="searchText"
                :density="activeQueryParams.length ? 'compact' : 'default'"
                :placeholder="placeholder"
                autocomplete="off"
                @focus="
                    isFocused = true;
                    $emit('focusChange', true);
                "
                @input="handleInput"
                @click:append-inner="searchText = ''"
            ></v-text-field>
        </div>

        <div
            v-if="isFocused && !!searchText"
            id="searchPredictionContainer"
            class="bg-surface rounded w-100 mt-2 pa-4 shadow absolute"
        >
            <div class="text-secondary text-caption">CONTENT QUERY</div>
            <div
                @click="handleParam(0)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 0,
                    'pa-2': perdictionSelectorCurrentIndex === 0,
                }"
            >
                <v-icon icon="mdi-magnify"></v-icon>
                <div class="text-primary text-body-1 ml-2 me-auto">{{ searchText }}</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 0" icon="mdi-keyboard-return"></v-icon>
            </div>

            <HorizontalLine v-if="mappedSuggestionsToType[SearchQueryParamType.TOPIC].length" parent-class="mt-4" />

            <div
                v-if="mappedSuggestionsToType[SearchQueryParamType.TOPIC].length"
                class="text-secondary text-caption mt-2"
            >
                TOPICS
            </div>
            <div
                v-for="topic in mappedSuggestionsToType[SearchQueryParamType.TOPIC]"
                :key="topic.value"
                @click="handleParam(topic.ndx)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === topic.ndx,
                    'pa-2': perdictionSelectorCurrentIndex === topic.ndx,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-pound" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">
                    {{ prettyPrintTopicValue(topic.value) }}
                </div>
                <v-icon v-if="perdictionSelectorCurrentIndex === topic.ndx" icon="mdi-keyboard-return"></v-icon>
            </div>

            <HorizontalLine v-if="mappedSuggestionsToType[SearchQueryParamType.AUTHOR].length" parent-class="mt-4" />

            <div
                v-if="mappedSuggestionsToType[SearchQueryParamType.AUTHOR].length"
                class="text-secondary text-caption mt-2"
            >
                PEOPLE
            </div>
            <div
                v-for="author in mappedSuggestionsToType[SearchQueryParamType.AUTHOR]"
                :key="author.value"
                @click="handleParam(author.ndx)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === author.ndx,
                    'pa-2': perdictionSelectorCurrentIndex === author.ndx,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-account-outline" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">{{ author.value }}</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === author.ndx" icon="mdi-keyboard-return"></v-icon>
            </div>

            <HorizontalLine v-if="mappedSuggestionsToType[SearchQueryParamType.SOURCE].length" parent-class="mt-4" />

            <div
                v-if="mappedSuggestionsToType[SearchQueryParamType.SOURCE].length"
                class="text-secondary text-caption mt-2"
            >
                SOURCES
            </div>
            <div
                v-for="source in mappedSuggestionsToType[SearchQueryParamType.SOURCE]"
                :key="source.value"
                @click="handleParam(source.ndx)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === source.ndx,
                    'pa-2': perdictionSelectorCurrentIndex === source.ndx,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-cloud-outline" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">
                    {{ startCase(source.value.toLowerCase()) }}
                </div>
                <v-icon v-if="perdictionSelectorCurrentIndex === source.ndx" icon="mdi-keyboard-return"></v-icon>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useSearchStore } from '../../stores/search';
    import { useUserStore } from '../../stores/user';
    import { storeToRefs } from 'pinia';
    import { SearchQueryParamType } from '../../types/search-store';
    import { useDataSourceStore } from '../../stores/dataSource';
    import { prettyPrintTopicValue } from '../../utility';
    import startCase from 'lodash/startCase';

    defineProps<{
        placeholder: string;
        width: string;
    }>();

    const emit = defineEmits(['queryParamAdded', 'focusChange']);

    const searchStore = useSearchStore();
    const { activeQueryParams, searchSuggestions } = storeToRefs(searchStore);
    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);
    const dataSourceStore = useDataSourceStore();
    const { dataSourceOptions } = storeToRefs(dataSourceStore);

    const isFocused = ref(false);
    const searchText = ref('');
    const perdictionSelectorCurrentIndex = ref(0);

    const mappedSuggestionsToType = computed(() => {
        const map = {
            [SearchQueryParamType.TOPIC]: [],
            [SearchQueryParamType.AUTHOR]: [],
            [SearchQueryParamType.SOURCE]: [],
        };

        // index 0 reserved for text content option
        searchSuggestions.value.forEach((suggestion, curNdx) =>
            map[suggestion.type].push({ ...suggestion, ndx: 1 + curNdx }),
        );

        return map;
    });

    const handleInput = debounce(function (event) {
        const inputText = event.target.value;
        if (inputText.length < 2) {
            return;
        }
        searchStore.getSearchSuggestions(
            inputText,
            userData.value!.organizationId ?? userData.value!.id,
            dataSourceOptions.value,
        );
    }, 400);

    function debounce(fn, delay) {
        let timeoutId: NodeJS.Timeout | null = null;

        return function (...args) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                fn(...args);
                timeoutId = null;
            }, delay);
        };
    }

    document.onkeydown = (e) => {
        if (!isFocused.value || !searchText.value) {
            return;
        }

        if (e.key === 'ArrowUp' && perdictionSelectorCurrentIndex.value > 0) {
            perdictionSelectorCurrentIndex.value -= 1;
        } else if (e.key === 'ArrowDown' && perdictionSelectorCurrentIndex.value < searchSuggestions.value.length) {
            perdictionSelectorCurrentIndex.value += 1;
        } else if (e.key === 'ArrowUp' && perdictionSelectorCurrentIndex.value === 0) {
            perdictionSelectorCurrentIndex.value = searchSuggestions.value.length;
        } else if (e.key === 'ArrowDown' && perdictionSelectorCurrentIndex.value === searchSuggestions.value.length) {
            perdictionSelectorCurrentIndex.value = 0;
        } else if (e.key === 'Escape') {
            searchText.value = '';
            isFocused.value = false;
            emit('focusChange');
        } else if (e.key === 'Enter') {
            handleParam();
        }
    };

    function handleParam(clickedIndex?: number) {
        isFocused.value = false;
        emit('focusChange');

        const ndx = clickedIndex ?? perdictionSelectorCurrentIndex.value;
        if (ndx === 0) {
            searchStore.addQueryParam(SearchQueryParamType.TEXT, searchText.value);
        } else {
            const selected = searchSuggestions.value[ndx - 1];
            searchStore.addQueryParam(selected.type, selected.value);
        }

        searchStore.executeSearchQuery(userData.value!.organizationId ?? userData.value!.id);
        searchText.value = '';
    }
</script>

<style scoped>
    .focused {
        border: 2px solid rgb(var(--v-theme-success));
    }
</style>
