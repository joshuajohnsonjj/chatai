import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
    DataSourceConnectionsResponse,
    DataSourceTypesResponse,
    DataSyncInterval,
    TestDataSourceConnectionResponse,
} from '../types/responses';
import {
    listDataSourceConnections,
    listDataSourceOptions,
    manualSyncDataSource,
    testConnection,
    updateDataSourceConnection,
} from '../requests';
import { UserType } from '../types/user-store';
import { googleSignIn, initGoogleClient } from '../services/googleAuth';
import { encrypt } from '../utility/encryption';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useDataSourceStore = defineStore('dataSource', () => {
    const connections = ref<DataSourceConnectionsResponse[]>([]);
    const dataSourceOptions = ref<DataSourceTypesResponse[]>([]);
    const dataSourceCategoryToOptionsMap = ref<Record<string, string[]>>({});
    const isLoading = ref({
        dataSourceConnections: false,
        dataSourceOptions: false,
        connectionTest: false,
        indexingIntervalUpdate: false,
        indexNowInvocation: false,
    });

    const dataSourceStorageUsageSum = computed(() =>
        connections.value.reduce((prev, curr) => prev + curr.mbStorageEstimate, 0),
    );

    const retreiveConnections = async () => {
        isLoading.value.dataSourceConnections = true;
        connections.value = await listDataSourceConnections();
        isLoading.value.dataSourceConnections = false;
    };

    const retreiveDataSourceOptions = async () => {
        isLoading.value.dataSourceOptions = true;

        if (!connections.value.length) {
            await retreiveConnections();
        }

        dataSourceOptions.value = await listDataSourceOptions();
        dataSourceOptions.value.forEach((option) => {
            option.userConnectedDataSourceId = connections.value.find(
                (dataSource) => dataSource.dataSourceName === option.name,
            )?.id;

            if (dataSourceCategoryToOptionsMap.value[option.category]) {
                dataSourceCategoryToOptionsMap.value[option.category].push(option.name);
            } else {
                dataSourceCategoryToOptionsMap.value[option.category] = [option.name];
            }
        });

        isLoading.value.dataSourceOptions = false;
    };

    const testDataSourceCredential = async (
        dataSourceTypeId: string,
        ownerEntityId: string,
        userType: UserType,
        secret: string,
    ): Promise<TestDataSourceConnectionResponse> => {
        isLoading.value.connectionTest = true;
        const encryptedSecret = await encrypt(secret);
        const res = await testConnection(dataSourceTypeId, ownerEntityId, userType, encryptedSecret);
        isLoading.value.connectionTest = false;
        return res;
    };

    const commitDataSourceConnectionUpdate = async (
        dataSourceId: string,
        userType: string,
        syncInterval: DataSyncInterval,
    ): Promise<boolean> => {
        let success = true;
        try {
            isLoading.value.indexingIntervalUpdate = true;
            await updateDataSourceConnection(dataSourceId, userType, syncInterval);
            const ndx = connections.value.findIndex((conn) => conn.id === dataSourceId);
            connections.value[ndx].selectedSyncInterval = syncInterval;
        } catch (e) {
            console.error(e);
            success = false;
        } finally {
            isLoading.value.indexingIntervalUpdate = false;
        }
        return success;
    };

    const initiateGoogleDriveSync = async (dataSourceId: string) => {
        try {
            isLoading.value.indexNowInvocation = true;

            await initGoogleClient();
            const authResponse = await googleSignIn();

            await manualSyncDataSource(dataSourceId, authResponse.id_token);

            const connNdx = connections.value.findIndex((conn) => conn.id === dataSourceId);
            connections.value[connNdx].isSyncing = true;

            toast.success('Google Drive indexing successfully initiated');
        } catch (error) {
            console.error(error);
            toast.error('Error signing in with Google. Indexing canceled.');
        } finally {
            isLoading.value.indexNowInvocation = false;
        }
    };

    return {
        connections,
        dataSourceOptions,
        dataSourceCategoryToOptionsMap,
        isLoading,
        dataSourceStorageUsageSum,
        retreiveConnections,
        retreiveDataSourceOptions,
        testDataSourceCredential,
        commitDataSourceConnectionUpdate,
        initiateGoogleDriveSync,
    };
});
