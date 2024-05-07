<template>
    <div class="d-flex justify-start">
        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-cloud-outline"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Source
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-shape-outline"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Category
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-account-group-outline"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Person
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-pound"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Topic
            </v-btn>

            <template #popper>
                <CheckboxsWithSearchFilter />
            </template>
        </VDropdown>

        <VDropdown :distance="12">
            <v-btn
                prepend-icon="mdi-calendar-range"
                variant="outlined"
                color="secondary"
                class="border-primary text-caption ml-2"
            >
                Date Range
            </v-btn>

            <template #popper>
                <CalendarRangeFilter />
            </template>
        </VDropdown>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';

    const activeFilterMenu = ref<string | null>(null);
</script>
