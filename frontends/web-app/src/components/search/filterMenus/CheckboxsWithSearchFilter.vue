<template>
    <div class="pa-2" style="min-width: 250px">
        <v-text-field
            prepend-inner-icon="mdi-magnify"
            placeholder="Search sources...."
            density="compact"
            variant="outlined"
            class="mb-2"
        ></v-text-field>

        <div style="height: 150px; overflow-y: scroll">
            <v-checkbox density="compact" label="Notion"></v-checkbox>
            <v-checkbox density="compact" label="Slack"></v-checkbox>
            <v-checkbox density="compact" label="Google Drive"></v-checkbox>
            <v-checkbox density="compact" label="Teams"></v-checkbox>
            <v-checkbox density="compact" label="Zoom"></v-checkbox>
        </div>

        <v-btn variant="tonal" color="blue" class="w-100 mt-4 mb-2">apply</v-btn>

        <div class="d-flex justify-space-between">
            <div class="text-primary text-caption">Selected: 5</div>
            <div class="text-secondary font-weight-bold text-caption button-hover" style="text-decoration: underline">
                Clear Selections
            </div>
        </div>
    </div>
</template>
