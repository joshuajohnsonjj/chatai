import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DataSourceConnectionsResponse, DataSourceTypesResponse } from '../types/responses';
import { listDataSourceConnections, listDataSourceOptions } from '../requests';

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

    return {
        connections,
        dataSourceOptions,
        dataSourceCategoryToOptionsMap,
        retreiveConnections,
        retreiveDataSourceOptions,
    };
});
