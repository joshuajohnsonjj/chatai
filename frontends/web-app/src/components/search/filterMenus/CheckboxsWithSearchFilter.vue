<template>
    <div class="pa-2" style="width: 300px">
        <v-text-field
            prepend-inner-icon="mdi-magnify"
            :placeholder="searchPlaceholder"
            density="compact"
            variant="outlined"
            class="mb-2"
            v-model="searchFilter"
            @input="handleInput"
        ></v-text-field>

        <div style="height: 150px; overflow-y: scroll">
            <v-checkbox
                v-for="option in filteredOptions"
                :key="option"
                density="compact"
                :label="formatStringStartCase(prettyPrintTopicValue(option))"
                :value="option"
                v-model="selectedOptions"
            ></v-checkbox>
        </div>

        <v-btn variant="tonal" color="blue" class="w-100 mt-4 mb-2" @click="onApply">apply</v-btn>

        <div class="d-flex justify-space-between">
            <div class="text-primary text-caption">Selected: {{ selectedOptions.length }}</div>
            <div
                class="text-secondary font-weight-bold text-caption button-hover link"
                @click="selectedOptions = []"
            >
                Clear Selections
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { formatStringStartCase, autocompleteSearch, prettyPrintTopicValue } from '../../../utility';
    import { useSearchStore } from '../../../stores/search';
    import { SearchQueryParamType } from '../../../types/search-store';
    import { storeToRefs } from 'pinia';
    import { useUserStore } from '../../../stores/user';
    import { hideAllPoppers } from 'floating-vue';
    import debounce from 'lodash/debounce';

    const props = defineProps<{
        searchPlaceholder: string;
        options: string[];
        isLocalSearch: boolean;
        type: SearchQueryParamType;
    }>();

    const searchStore = useSearchStore();
    const { topicFilterOptions } = storeToRefs(searchStore);

    const userStore = useUserStore();
    const { userEntityId } = storeToRefs(userStore);

    const selectedOptions = ref<string[]>([]);
    const searchFilter = ref<string>('');

    const filteredOptions = computed(() => {
        if (!searchFilter.value) {
            return props.options;
        }
        if (props.isLocalSearch) {
            return autocompleteSearch(searchFilter.value, props.options);
        }
        if (props.type === SearchQueryParamType.TOPIC) {
            return topicFilterOptions.value;
        }
        if (props.type === SearchQueryParamType.AUTHOR) {
            return [];
        }
        return [];
    });

    const onApply = () => {
        selectedOptions.value.forEach((option) => searchStore.addQueryParam(props.type, option));
        searchStore.executeSearchQuery(userEntityId.value);
        hideAllPoppers();
    };

    const handleInput = debounce(function (event) {
        const inputText = event.target.value;
        if (inputText.length < 1 || props.isLocalSearch) {
            return;
        }

        if (props.type === SearchQueryParamType.TOPIC) {
            searchStore.getFilterTopicOptions(userEntityId.value, inputText);
        } else if (props.type === SearchQueryParamType.AUTHOR) {
            searchStore.getFilterAuthorOptions();
        }
    }, 400);
</script>
