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
    createDataSource,
    listDataSourceConnections,
    listDataSourceOptions,
    testConnection,
    updateDataSourceConnection,
} from '../requests';
import { encrypt } from '../utility/encryption';
import { APIEndpoints } from '../types/requests';
import { OAUTH_REDIRECT_PATH } from '../constants/localStorageKeys';
import { useToast } from 'vue-toastification';
import { CreateDataSourceRequest } from '../types/data-source-store';

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
        connectionUpdate: false,
        indexNowInvocation: false,
        createDataSource: false,
    });

    const dataSourceStorageUsageSum = computed(() =>
        connections.value.reduce((prev, curr) => prev + curr.mbStorageEstimate, 0),
    );

    const retreiveConnections = async () => {
        isLoading.value.dataSourceConnections = true;

        try {
            connections.value = await listDataSourceConnections();
        } finally {
            isLoading.value.dataSourceConnections = false;
        }
    };

    const retreiveDataSourceOptions = async () => {
        isLoading.value.dataSourceOptions = true;

        if (!connections.value.length) {
            await retreiveConnections();
        }

        try {
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
        } finally {
            isLoading.value.dataSourceOptions = false;
        }
    };

    const createDataSourceConnection = async (createData: CreateDataSourceRequest) => {
        isLoading.value.createDataSource = true;

        try {
            const resp = await createDataSource({
                ...createData,
                secret: await encrypt(createData.secret),
            });
            connections.value.push(resp);
        } finally {
            isLoading.value.createDataSource = false;
        }
    };

    const testDataSourceCredential = async (
        dataSourceTypeName: string,
        secret: string,
        externalId?: string,
    ): Promise<TestDataSourceConnectionResponse> => {
        isLoading.value.connectionTest = true;

        let result: TestDataSourceConnectionResponse;

        try {
            const encryptedSecret = await encrypt(secret);
            result = await testConnection(dataSourceTypeName, encryptedSecret, externalId);
        } catch (e) {
            result = {
                isValid: false,
                message: 'An error occured. Contact support if issue continues',
            };
        } finally {
            isLoading.value.connectionTest = false;
        }

        return result;
    };

    const commitDataSourceConnectionUpdate = async (updates: {
        syncInterval?: DataSyncInterval;
        additionalConfig?: any;
    }): Promise<boolean> => {
        if (!currentConfiguring.value) {
            return false;
        }

        let success = true;
        try {
            isLoading.value.connectionUpdate = true;
            await updateDataSourceConnection(currentConfiguring.value.id, updates);
            const ndx = connections.value.findIndex((conn) => conn.id === currentConfiguring.value!.id);

            if ('syncInterval' in updates) {
                connections.value[ndx].selectedSyncInterval = updates.syncInterval!;
                currentConfiguring.value.selectedSyncInterval = updates.syncInterval!;
            }

            if ('additionalConfig' in updates) {
                connections.value[ndx].additionalConfig = updates.additionalConfig!;
                currentConfiguring.value.additionalConfig = updates.additionalConfig!;
            }
        } catch (e) {
            console.error(e);
            success = false;
        } finally {
            isLoading.value.connectionUpdate = false;
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

            await updateDataSourceConnection(currentConfiguring.value.id, { secret: accessToken, refreshToken });

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
        createDataSourceConnection,
    };
});
