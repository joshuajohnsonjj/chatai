<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6">
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

        <div v-if="isSearchStarted" class="mt-4">
            <div class="d-flex justify-space-between">
                <SearchActiveFilters />

                <div class="text-secondary text-body-2">20 results</div>
            </div>
            <HorizontalLine thinkness="3px" />

            <div style="height: 76.8vh; overflow-y: scroll">
                <SearchResultRow v-for="n in 20" :key="n" />
            </div>
        </div>
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
