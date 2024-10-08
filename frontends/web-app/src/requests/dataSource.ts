import { APIEndpoints, APIMethods } from '../types/requests';
import type {
    DataSourceConnectionsResponse,
    DataSourceTypesResponse,
    DataSyncInterval,
    TestDataSourceConnectionResponse,
} from '../types/responses';
import { sendAxiosRequest } from './service';
import { CreateDataSourceRequest } from '../types/data-source-store';

export const updateDataSourceConnection = async (
    dataSourceId: string,
    data: {
        syncInterval?: DataSyncInterval;
        secret?: string;
        refreshToken?: string;
        additionalConfig?: any;
    },
): Promise<void> => {
    await sendAxiosRequest({
        method: APIMethods.PATCH,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE_CONNECTION.replace(':dataSourceId', dataSourceId),
        data,
    });
};

export const listDataSourceConnections = async (): Promise<DataSourceConnectionsResponse[]> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE_CONNECTIONS,
    });
    return resp as DataSourceConnectionsResponse[];
};

export const listDataSourceOptions = async (): Promise<DataSourceTypesResponse[]> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE,
    });
    return resp as DataSourceTypesResponse[];
};

export const testConnection = async (
    dataSourceTypeName: string,
    secret: string,
    externalId?: string,
): Promise<TestDataSourceConnectionResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.POST,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.TEST_DATA_SOURCE,
        data: {
            dataSourceTypeName,
            secret,
            externalId,
        },
    });
    return resp as TestDataSourceConnectionResponse;
};

export const createDataSource = async (data: CreateDataSourceRequest): Promise<DataSourceConnectionsResponse> => {
    const resp = await sendAxiosRequest({
        method: APIMethods.POST,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE,
        data,
    });
    return resp as DataSourceConnectionsResponse;
};

export const manualSyncDataSource = async (dataSourceId: string, secret: string): Promise<void> => {
    await sendAxiosRequest({
        method: APIMethods.POST,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE_SYNC.replace(':dataSourceId', dataSourceId),
        data: { secret },
    });
};
