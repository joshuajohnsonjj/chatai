import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import find from 'lodash/find';
import type {
    DataSourceConnectionsResponse,
    DataSourceTypesResponse,
    DataSyncInterval,
    TestDataSourceConnectionResponse,
} from '../types/responses';
import {
    listDataSourceConnections,
    listDataSourceOptions,
    testConnection,
    updateDataSourceConnection,
} from '../requests';
import { UserType } from '../types/user-store';
import { encrypt } from '../utility/encryption';
import { APIEndpoints } from '../types/requests';
import { OAUTH_REDIRECT_PATH } from '../constants/localStorageKeys';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useDataSourceStore = defineStore('dataSource', () => {
    const connections = ref<DataSourceConnectionsResponse[]>([]);
    const currentConfiguring = ref<DataSourceConnectionsResponse | null>(null);
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

    const commitDataSourceConnectionUpdate = async (syncInterval: DataSyncInterval): Promise<boolean> => {
        if (!currentConfiguring.value) {
            return false;
        }

        let success = true;
        try {
            isLoading.value.indexingIntervalUpdate = true;
            await updateDataSourceConnection(currentConfiguring.value.id, { syncInterval });
            const ndx = connections.value.findIndex((conn) => conn.id === currentConfiguring.value!.id);
            connections.value[ndx].selectedSyncInterval = syncInterval;
            currentConfiguring.value.selectedSyncInterval = syncInterval;
        } catch (e) {
            console.error(e);
            success = false;
        } finally {
            isLoading.value.indexingIntervalUpdate = false;
        }
        return success;
    };

    const authenticateGoogle = async () => {
        isLoading.value.connectionTest = true;
        localStorage.setItem(OAUTH_REDIRECT_PATH, window.location.pathname);
        window.location.href = `${(import.meta as any).env.VITE_API_BASE_URL}${APIEndpoints.GOOGLE_AUTHENTICATE}`;
    };

    const setCurrentConfiguring = (id?: string) => {
        if (id) {
            currentConfiguring.value = find(connections.value, (option) => option.id === id)!;
        } else {
            currentConfiguring.value = null;
        }
    };

    const updateOAuthCredentials = async (accessToken: string, refreshToken: string) => {
        if (!currentConfiguring.value) {
            return;
        }

        try {
            isLoading.value.connectionTest = true;

            await updateDataSourceConnection(currentConfiguring.value.id, { accessToken, refreshToken });

            toast.success('OAuth authentication succeeded!');
        } finally {
            isLoading.value.connectionTest = false;
        }
    };

    return {
        connections,
        dataSourceOptions,
        dataSourceCategoryToOptionsMap,
        isLoading,
        dataSourceStorageUsageSum,
        currentConfiguring,
        retreiveConnections,
        retreiveDataSourceOptions,
        testDataSourceCredential,
        commitDataSourceConnectionUpdate,
        authenticateGoogle,
        setCurrentConfiguring,
        updateOAuthCredentials,
    };
});
