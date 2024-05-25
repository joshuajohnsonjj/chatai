import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
    DataSourceConnectionsResponse,
    DataSourceTypesResponse,
    TestDataSourceConnectionResponse,
} from '../types/responses';
import { listDataSourceConnections, listDataSourceOptions, testConnection } from '../requests';
import { UserType } from '../types/user-store';

export const useDataSourceStore = defineStore('dataSource', () => {
    const connections = ref<DataSourceConnectionsResponse[]>([]);
    const dataSourceOptions = ref<DataSourceTypesResponse[]>([]);
    const dataSourceCategoryToOptionsMap = ref<Record<string, string[]>>({});
    const isLoading = ref({
        dataSourceConnections: false,
        dataSourceOptions: false,
        connectionTest: false,
    });

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
        if (secret.length < 5) {
            return {
                isValid: false,
                message: 'Invalid credential',
            };
        }

        isLoading.value.connectionTest = true;
        const res = await testConnection(dataSourceTypeId, ownerEntityId, userType, secret);
        isLoading.value.connectionTest = false;

        return res;
    };

    return {
        connections,
        dataSourceOptions,
        dataSourceCategoryToOptionsMap,
        isLoading,
        retreiveConnections,
        retreiveDataSourceOptions,
        testDataSourceCredential,
    };
});
