<template>
    <div class="pa-2" style="min-width: 250px">
        <v-row>
            <v-col cols="2">
                <div class="text-primary text-body-2 text-center w-100" style="line-height: 40px">From:</div>
            </v-col>
            <v-col cols="10">
                <v-text-field variant="outlined" density="compact" type="date" class="mr-4"></v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="2">
                <div class="text-primary text-body-2 text-center w-100" style="line-height: 40px">To:</div>
            </v-col>
            <v-col cols="10">
                <v-text-field variant="outlined" density="compact" type="date" class="mr-4"></v-text-field>
            </v-col>
        </v-row>

        <v-btn variant="tonal" color="blue" class="w-100 mt-4 mb-2">apply</v-btn>

        <div class="d-flex justify-end">
            <div class="text-secondary font-weight-bold text-caption button-hover link">
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
