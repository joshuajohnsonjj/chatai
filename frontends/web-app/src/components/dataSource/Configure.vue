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
                <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${sourceData.name}.png`" size="80"></v-avatar>
                <div class="ml-4">
                    <div class="d-flex justify-start">
                        <p v-if="!isAddNew" class="text-h5 text-primary mb-1 font-weight-medium">
                            {{ formatStringStartCase(sourceData.name ?? '') }} Integration Details
                        </p>
                        <p v-else class="text-h5 text-primary mb-1 font-weight-medium">
                            Add {{ formatStringStartCase(sourceData.name ?? '') }} Integration
                        </p>

                        <HelpBox
                            class="icon-primary grow-hover button-hover ml-2 pb-6"
                            style="width: 15px"
                            @click="openDocs"
                        />
                    </div>

                    <div v-if="!isAddNew">
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-calendar-blank" color="secondary"></v-icon>
                            Linked since {{ moment(sourceData.createdAt).format('M/D/YYYY') }}
                        </p>
                        <p class="text-caption text-secondary sub-info-line-height">
                            <v-icon icon="mdi-archive-outline" color="secondary"></v-icon>
                            4 GB used
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="!isAddNew" style="max-width: 250px">
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
                    <div class="d-flex justify-start">
                        <p class="text-h6 text-primary font-weight-medium">Access management</p>
                        <HelpBox
                            class="icon-primary grow-hover button-hover ml-2 pb-6"
                            style="width: 12px"
                            @click="openAuthDocs"
                        />
                    </div>
                    <p class="text-caption text-secondary" style="max-width: 250px">
                        Your credentials are used to connect to and synchronize the data source
                    </p>

                    <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">Update API Key</p>
                    <v-text-field
                        type="password"
                        placeholder="****************"
                        variant="outlined"
                        v-model="apiKeyInput"
                    ></v-text-field>

                    <div class="d-flex justify-end mt-4">
                        <v-btn variant="plain" @click="onTestConnection">Test connection</v-btn>
                        <v-btn color="blue" variant="tonal">Update keys</v-btn>
                    </div>
                </v-sheet>
            </v-col>
            <v-col cols="6">
                <v-sheet class="border-primary rounded pa-6">
                    <p class="text-h6 text-primary font-weight-medium">Indexing configuration</p>
                    <p class="text-caption text-secondary" style="max-width: 250px">
                        Configure the interval with which your content is indexed
                    </p>

                    <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">Update API Key</p>
                    <v-text-field
                        type="password"
                        placeholder="****************"
                        variant="outlined"
                        v-model="apiKeyInput"
                    ></v-text-field>

                    <div class="d-flex justify-end mt-4">
                        <v-btn variant="plain" @click="onTestConnection">Test connection</v-btn>
                        <v-btn color="blue" variant="tonal">Update keys</v-btn>
                    </div>
                </v-sheet>
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
    import { computed, onBeforeMount, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useDataSourceStore } from '../../stores/dataSource';
    import { useUserStore } from '../../stores/user';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../../constants';
    import { formatStringStartCase } from '../../utility';
    import find from 'lodash/find';
    import { useRoute } from 'vue-router';
    import moment from 'moment';
    import { useToast } from 'vue-toastification';
    import { KnowledgeBaseMap } from '../../constants/knowledgeBase';

    const props = defineProps<{
        isAddNew: boolean;
    }>();

    const route = useRoute();
    const toast = useToast();

    const dataSourceStore = useDataSourceStore();
    const { connections, dataSourceOptions } = storeToRefs(dataSourceStore);
    const userStore = useUserStore();
    const { userData, userEntityId } = storeToRefs(userStore);

    const apiKeyInput = ref<string>('');

    onBeforeMount(async () => {
        if (!props.isAddNew && !connections.value.length) {
            await dataSourceStore.retreiveConnections();
        } else if (props.isAddNew && !dataSourceOptions.value.length) {
            await dataSourceStore.retreiveDataSourceOptions();
        }
    });

    const sourceData = computed(() => {
        if (props.isAddNew) {
            const sourceType = find(dataSourceOptions.value, (option) => option.id === route.params.dataSourceTypeId);
            return {
                name: sourceType?.name,
                dataSourceTypeId: route.params.dataSourceTypeId,
            };
        } else {
            const source = find(connections.value, (option) => option.id === route.params.dataSourceId);
            return {
                name: source?.dataSourceName,
                createdAt: source?.createdAt,
                dataSourceTypeId: source?.dataSourceTypeId,
            };
        }
    });

    const onTestConnection = async () => {
        const result = await dataSourceStore.testDataSourceCredential(
            sourceData.value.dataSourceTypeId as string,
            userEntityId.value,
            userData.value!.type,
            apiKeyInput.value,
        );

        if (result.isValid) {
            toast.success('Credential valid!');
        } else {
            toast.error(result.message);
        }
    };

    const openDocs = () => window.open(KnowledgeBaseMap[sourceData.value.name as string].root, '_blank')!.focus();

    const openAuthDocs = () => window.open(KnowledgeBaseMap[sourceData.value.name as string].auth, '_blank')!.focus();
</script>
