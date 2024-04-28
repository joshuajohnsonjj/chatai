import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DataSourceConnectionsResponse, DataSourceTypesResponse } from '../types/responses';
import { listDataSourceConnections, listDataSourceOptions } from '../requests';

export const useDataSourceStore = defineStore('dataSource', () => {
    const connections = ref<DataSourceConnectionsResponse[]>([]);
    const dataSourceOptions = ref<DataSourceTypesResponse[]>([]);

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
        });
    };

    return {
        connections,
        dataSourceOptions,
        retreiveConnections,
        retreiveDataSourceOptions,
    };
});
