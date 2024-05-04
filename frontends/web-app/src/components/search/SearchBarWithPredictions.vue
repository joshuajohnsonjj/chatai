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
                prepend-inner-icon="mdi-magnify"
                :append-inner-icon="isFocused ? 'mdi-close' : ''"
                variant="solo"
                hide-details
                v-model="searchText"
                :density="activeQueryParams.length ? 'compact' : 'default'"
                :placeholder="placeholder"
                @focus="
                    isFocused = true;
                    $emit('focusChange', true);
                "
                @click:append-inner="searchText = ''"
            ></v-text-field>
        </div>

        <div
            v-if="isFocused && !!searchText"
            id="searchPredictionContainer"
            class="bg-surface rounded w-100 mt-2 pa-4 shadow"
            style="position: absolute"
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

            <HorizontalLine parent-class="mt-4" />

            <div class="text-secondary text-caption mt-2">TOPICS</div>
            <div
                @click="handleParam(1)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 1,
                    'pa-2': perdictionSelectorCurrentIndex === 1,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-pound" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">
                    2023 Financial Statements
                </div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 1" icon="mdi-keyboard-return"></v-icon>
            </div>
            <div
                @click="handleParam(2)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 2,
                    'pa-2': perdictionSelectorCurrentIndex === 2,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-pound" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">2023 Market Analysis</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 2" icon="mdi-keyboard-return"></v-icon>
            </div>
            <div
                @click="handleParam(3)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 3,
                    'pa-2': perdictionSelectorCurrentIndex === 3,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-pound" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">Market Research</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 3" icon="mdi-keyboard-return"></v-icon>
            </div>

            <HorizontalLine parent-class="mt-4" />

            <div class="text-secondary text-caption mt-2">PEOPLE</div>
            <div
                @click="handleParam(4)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 4,
                    'pa-2': perdictionSelectorCurrentIndex === 4,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-account-outline" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">Stavros Halkias</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 4" icon="mdi-keyboard-return"></v-icon>
            </div>
            <div
                @click="handleParam(5)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 5,
                    'pa-2': perdictionSelectorCurrentIndex === 5,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-account-outline" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">Bill Burr</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 5" icon="mdi-keyboard-return"></v-icon>
            </div>
            <div
                @click="handleParam(6)"
                class="d-flex mt-1 mb-2 rounded button-hover"
                :class="{
                    'bg-surface-bright': perdictionSelectorCurrentIndex === 6,
                    'pa-2': perdictionSelectorCurrentIndex === 6,
                }"
            >
                <div class="bg-surface-bright" style="border-radius: 50%">
                    <v-icon icon="mdi-account-outline" style="font-size: 11px; margin: 0 6px 0 6px"></v-icon>
                </div>
                <div class="text-primary text-caption ml-2 me-auto" style="line-height: 23px">Andrew Schulz</div>
                <v-icon v-if="perdictionSelectorCurrentIndex === 6" icon="mdi-keyboard-return"></v-icon>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { useSearchStore } from '../../stores/search';
    import { useUserStore } from '../../stores/user';
    import { storeToRefs } from 'pinia';
    import { SearchQueryParamType } from '../../types/search-store';

    defineProps<{
        placeholder: string;
        width: string;
    }>();

    const emit = defineEmits(['queryParamAdded', 'focusChange']);

    const searchStore = useSearchStore();
    const { activeQueryParams } = storeToRefs(searchStore);
    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);

    const isFocused = ref(false);
    const searchText = ref('');
    const perdictionSelectorCurrentIndex = ref(0);

    const suggestionsList = ref<any[]>([
        {
            type: SearchQueryParamType.TEXT,
            value: '',
        },
        {
            type: SearchQueryParamType.TOPIC,
            value: '2023 Financial Statements',
        },
        {
            type: SearchQueryParamType.TOPIC,
            value: '2023 Market Analysis',
        },
        {
            type: SearchQueryParamType.TOPIC,
            value: 'Market Research',
        },
        {
            type: SearchQueryParamType.AUTHOR,
            value: 'Stavros Halkias',
        },
        {
            type: SearchQueryParamType.AUTHOR,
            value: 'Bill Burr',
        },
        {
            type: SearchQueryParamType.AUTHOR,
            value: 'Andrew Schulz',
        },
    ]);

    document.onkeydown = (e) => {
        if (!isFocused.value || !searchText.value) {
            return;
        }

        if (e.key === 'ArrowUp' && perdictionSelectorCurrentIndex.value > 0) {
            perdictionSelectorCurrentIndex.value -= 1;
        } else if (e.key === 'ArrowDown' && perdictionSelectorCurrentIndex.value < suggestionsList.value.length) {
            perdictionSelectorCurrentIndex.value += 1;
        } else if (e.key === 'ArrowUp' && perdictionSelectorCurrentIndex.value === 0) {
            perdictionSelectorCurrentIndex.value = suggestionsList.value.length;
        } else if (e.key === 'ArrowDown' && perdictionSelectorCurrentIndex.value === suggestionsList.value.length) {
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
        const selected = suggestionsList.value[ndx];

        searchStore.addQueryParam(selected.type, ndx === 0 ? searchText.value : selected.value);

        searchStore.executeSearchQuery(userData.value!.organizationId ?? userData.value!.id);

        searchText.value = '';
    }
</script>

<style scoped>
    .focused {
        border: 2px solid rgb(var(--v-theme-success));
    }
</style>
