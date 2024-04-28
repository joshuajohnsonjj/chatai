<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6">
        <v-row>
            <v-col :cols="isSearchStarted ? '1' : '12'" class="d-flex justify-center">
                <img
                    src="../assets/orb.gif"
                    :width="isSearchStarted ? '100' : '300'"
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
                    @focus-change="(isFocused) => (searchIsFocused = isFocused)"
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

        <v-row class="d-flex justify-start mb-3">
            <SearchActiveFilter
                v-for="param in activeQueryParams"
                :key="param.value"
                :value="param.value"
                :type="param.type"
            />
        </v-row>

        <HorizontalLine />

        <SearchResultRow />
    </div>
</template>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useSearchStore } from '../stores/search';
    import { storeToRefs } from 'pinia';

    const searchStore = useSearchStore();
    const { activeQueryParams } = storeToRefs(searchStore);

    const searchIsFocused = ref(false);

    const isSearchStarted = computed(() => activeQueryParams.value.length > 0);
    const searchColumnWith = computed(() => {
        if (isSearchStarted.value && !searchIsFocused.value) return '4';
        if (isSearchStarted.value && searchIsFocused.value) return '8';
        return '12';
    });
</script>

<style scoped></style>
