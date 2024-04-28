<template>
    <v-row class="py-4">
        <v-col cols="3">
            <div class="d-flex justify-start">
                <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${'NOTION'}.png`" size="90"></v-avatar>
                <div class="ml-4 mt-5">
                    <div class="text-primary text-h5 font-weight-medium">Notion</div>
                    <div class="text-secondary font-weight-light text-body-1">Note taking</div>
                </div>
            </div>
        </v-col>

        <v-col cols="7">
            <div class="ml-4 mt-2">
                <div class="text-primary text-body-1 font-weight-bold">Seller Financing Platform</div>
                <div class="text-primary text-body-2">
                    When it comes to crafting a user interface (UI) and user experience (UX) for your software project,
                    it's crucial to prioritize...
                </div>
                <div class="d-flex justify-start">
                    <div class="text-secondary text-caption mr-1">Authored by: Joshua Johnson</div>
                    <v-icon icon="mdi-circle-small" color="secondary" style="font-size: 19px"></v-icon>
                    <div class="text-secondary text-caption ml-1">Modified: 4/11/24 11:15 AM</div>
                </div>
            </div>
        </v-col>

        <v-col cols="2">
            <v-btn variant="tonal" color="info" class="mb-1">view details</v-btn>
            <v-btn variant="tonal" color="blue">open source</v-btn>
        </v-col>
    </v-row>

    <HorizontalLine />
</template>

<script lang="ts" setup>
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../../constants';
</script>
