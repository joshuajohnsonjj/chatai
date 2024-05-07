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

    const retreiveConnections = async () => {
        connections.value = await listDataSourceConnections();
    };

    const retreiveDataSourceOptions = async () => {
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

        return testConnection(dataSourceTypeId, ownerEntityId, userType, secret);
    };

    return {
        connections,
        dataSourceOptions,
        dataSourceCategoryToOptionsMap,
        retreiveConnections,
        retreiveDataSourceOptions,
        testDataSourceCredential,
    };
});
