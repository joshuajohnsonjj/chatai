import { APIEndpoints, APIMethods } from '../types/requests';
import type { DataSourceConnectionsResponse, DataSourceTypesResponse } from '../types/responses';
import { sendAPIRequest } from './service';

export const listDataSourceConnections = async (): Promise<DataSourceConnectionsResponse[]> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: APIEndpoints.DATA_SOURCE_CONNECTION,
    });
    return resp as DataSourceConnectionsResponse[];
};

export const listDataSourceOptions = async (): Promise<DataSourceTypesResponse[]> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: APIEndpoints.DATA_SOURCE,
    });
    return resp as DataSourceTypesResponse[];
};
