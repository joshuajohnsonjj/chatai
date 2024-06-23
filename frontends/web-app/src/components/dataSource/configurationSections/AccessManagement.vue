<template>
    <v-sheet class="border-primary rounded pa-6" style="height: 302px">
        <div class="d-flex justify-start">
            <p class="text-h6 text-primary font-weight-medium">Access management</p>
            <HelpBox class="icon-primary grow-hover button-hover ml-2 pb-6" style="width: 12px" @click="openAuthDocs" />
        </div>
        <p class="text-caption text-secondary" style="max-width: 250px">
            Your credentials are used to connect to and index the data source
        </p>

        <div v-if="currentConfiguring?.dataSourceName === DataSourceTypeName.GOOGLE_DRIVE">
            <v-btn
                class="body-action-btn"
                variant="tonal"
                :loading="isLoading.connectionTest"
                @click="onAuthorizeWithGoogle"
                >Authorize with Google</v-btn
            >
        </div>
        <div v-else>
            <p class="mt-8 mb-2 text-body-1 font-weight-medium text-primary">Update API Key</p>
            <v-text-field
                type="password"
                placeholder="****************"
                variant="outlined"
                v-model="apiKeyInput"
            ></v-text-field>

            <div class="d-flex justify-end mt-4">
                <v-btn
                    class="body-action-btn"
                    variant="plain"
                    :loading="isLoading.connectionTest"
                    @click="onTestConnection"
                    :disabled="apiKeyInput.length < 5"
                    >Test connection</v-btn
                >
                <v-btn class="body-action-btn" color="blue" variant="tonal" :disabled="apiKeyInput.length < 5"
                    >Update Key</v-btn
                >
            </div>
        </div>
    </v-sheet>
</template>

<script setup lang="ts">
    import { storeToRefs } from 'pinia';
    import { KnowledgeBaseMap } from '../../../constants/knowledgeBase';
    import { useDataSourceStore } from '../../../stores/dataSource';
    import { useToast } from 'vue-toastification';
    import { ref } from 'vue';
    import { DataSourceTypeName } from '../../../types/responses';

    const toast = useToast();

    const dataSourceStore = useDataSourceStore();
    const { isLoading, currentConfiguring } = storeToRefs(dataSourceStore);

    const apiKeyInput = ref<string>('');

    const onTestConnection = async () => {
        if (apiKeyInput.value.length < 5) {
            toast.error('Invalid token');
            return;
        }

        const result = await dataSourceStore.testDataSourceCredential(
            currentConfiguring.value!.dataSourceName,
            apiKeyInput.value,
        );

        if (result.isValid) {
            toast.success('Credential valid!');
        } else {
            toast.error(result.message);
        }
    };

    const onAuthorizeWithGoogle = async () => {
        await dataSourceStore.authenticateGoogle();
    };

    const openAuthDocs = () =>
        window.open(KnowledgeBaseMap[currentConfiguring.value?.dataSourceName as string].auth, '_blank')!.focus();
</script>

<style scoped>
    .body-action-btn {
        width: 200px;
    }
</style>
