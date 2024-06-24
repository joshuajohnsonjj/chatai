<template>
    <div class="pa-2" style="min-width: 250px">
        <v-row>
            <v-col cols="2">
                <div class="text-primary text-body-2 text-center w-100" style="line-height: 40px">From:</div>
            </v-col>
            <v-col cols="10">
                <v-text-field
                    variant="outlined"
                    density="compact"
                    type="date"
                    class="mr-4"
                    v-model="lowerRange"
                ></v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="2">
                <div class="text-primary text-body-2 text-center w-100" style="line-height: 40px">To:</div>
            </v-col>
            <v-col cols="10">
                <v-text-field
                    variant="outlined"
                    density="compact"
                    type="date"
                    class="mr-4"
                    v-model="upperRange"
                ></v-text-field>
            </v-col>
        </v-row>

        <v-btn variant="tonal" color="blue" class="w-100 mt-4 mb-2" :disabled="isNoDatesSelected" @click="onApply"
            >apply</v-btn
        >

        <div class="d-flex justify-end">
            <div class="text-secondary font-weight-bold text-caption button-hover link" @click="onClear">
                Clear Dates
            </div>
        </div>
    </div>
</template>

<style>
    .v-picker-title,
    .v-picker__header {
        display: none !important;
    }
</style>

<script lang="ts" setup>
    import { computed, ref } from 'vue';
    import { useSearchStore } from '../../../stores/search';
    import { storeToRefs } from 'pinia';
    import { useUserStore } from '../../../stores/user';
    import { hideAllPoppers } from 'floating-vue';
    import { SearchQueryParamType } from '../../../types/search-store';

    const searchStore = useSearchStore();

    const userStore = useUserStore();
    const { userEntityId } = storeToRefs(userStore);

    const lowerRange = ref<string>();
    const upperRange = ref<string>();

    const isNoDatesSelected = computed(() => !lowerRange.value && !upperRange.value);

    const onClear = () => {
        lowerRange.value = undefined;
        upperRange.value = undefined;
    };

    const onApply = () => {
        if (isNoDatesSelected.value) {
            hideAllPoppers();
            return;
        }

        if (lowerRange.value) {
            searchStore.addQueryParam(SearchQueryParamType.DATE_LOWER, lowerRange.value);
        }

        if (upperRange.value) {
            searchStore.addQueryParam(SearchQueryParamType.DATE_UPPER, upperRange.value);
        }

        searchStore.executeSearchQuery(userEntityId.value);
        hideAllPoppers();
    };
</script>
