<template>
    <div class="bg-surface w-100 h-100 rounded-xl pa-6">
        <v-btn
            icon="mdi-arrow-left"
            class="rounded"
            variant="tonal"
            style="width: 40px; height: 40px"
            @click="$router.go(-1)"
        ></v-btn>

        <div class="bg-background w-100 pa-6 rounded mb-6 mt-4 d-flex justify-space-between">
            <div class="d-flex justify-start">
                <v-avatar
                    :image="`${BASE_S3_DATASOURCE_LOGO_URL}${selectedDataSource.dataSourceName}.png`"
                    size="60"
                ></v-avatar>
                <div class="ml-4">
                    <p class="text-h5 text-primary mb-1">
                        {{ formatStringStartCase(selectedDataSource.dataSourceName) }} Integration Settings
                    </p>
                    <div class="d-flex justify-start">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-calendar-blank" color="secondary"></v-icon>
                            Linked since {{ moment(selectedDataSource.createdAt).format('M/D/YYYY') }}
                        </p>
                    </div>
                </div>
            </div>

            <div style="max-width: 250px">
                <v-btn class="w-100 mb-2" color="success" prepend-icon="mdi-cloud-sync" variant="tonal"
                    >Sync data source</v-btn
                >
                <v-btn class="w-100" color="warning" prepend-icon="mdi-trash-can" variant="tonal"
                    >Remove data source</v-btn
                >
            </div>
        </div>

        <v-row>
            <v-col cols="6">
                <v-sheet class="border-primary rounded pa-6">
                    <p class="text-h6 text-primary">Access management</p>
                    <p class="text-caption text-secondary" style="max-width: 250px">
                        Your credentials are used to connect to and synchronize the data source
                    </p>

                    <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">API Key</p>
                    <v-text-field type="password" placeholder="****************" variant="outlined"></v-text-field>

                    <div class="d-flex justify-end mt-4">
                        <v-btn variant="plain">Test connection</v-btn>
                        <v-btn color="blue" variant="tonal">Update keys</v-btn>
                    </div>
                </v-sheet>
            </v-col>
            <v-col cols="6">
                <v-sheet class="border-primary rounded pa-6"> Access management </v-sheet>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-sheet class="border-primary rounded pa-6"> Configurations </v-sheet>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" setup>
    import { computed, onBeforeMount } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../stores/dataSource';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../constants';
    import { formatStringStartCase } from '../utility';
    import find from 'lodash/find';
    import { useRoute } from 'vue-router';
    import moment from 'moment';

    const route = useRoute();

    const dataSourceStore = useDataSourceStore();
    const { connections } = storeToRefs(dataSourceStore);

    onBeforeMount(async () => {
        if (!connections.value.length) {
            await dataSourceStore.retreiveConnections();
        }
    });

    const selectedDataSource = computed(() =>
        find(connections.value, (option) => option.id === route.params.dataSourceId),
    );
    console.log(selectedDataSource.value);
</script>
