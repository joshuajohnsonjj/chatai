<template>
    <div class="pa-2" style="min-width: 250px">
        <div class="d-flex justify-space-between">
            From: <v-text-field variant="outlined" density="compact" type="date" class="mr-4"></v-text-field>
        </div>
        <div class="d-flex justify-space-between">
            To: <v-text-field variant="outlined" density="compact" type="date" class="mr-4"></v-text-field>
        </div>
    </div>
</template>

<style>
    .v-picker-title,
    .v-picker__header {
        display: none !important;
    }
</style>
