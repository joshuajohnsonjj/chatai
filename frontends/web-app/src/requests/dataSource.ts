import { APIEndpoints, APIMethods } from '../types/requests';
import type {
    DataSourceConnectionsResponse,
    DataSourceTypesResponse,
    DataSyncInterval,
    TestDataSourceConnectionResponse,
} from '../types/responses';
import { sendAPIRequest } from './service';
import { UserType } from '../types/user-store';

export const updateDataSourceConnection = async (
    dataSourceId: string,
    userType: string,
    syncInterval: DataSyncInterval,
): Promise<void> => {
    await sendAPIRequest({
        method: APIMethods.PATCH,
        headers: { 'Content-Type': 'application/json' },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE_CONNECTION.replace(':dataSourceId', dataSourceId),
        data: { userType, syncInterval },
    });
};

export const listDataSourceConnections = async (): Promise<DataSourceConnectionsResponse[]> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE_CONNECTIONS,
    });
    return resp as DataSourceConnectionsResponse[];
};

export const listDataSourceOptions = async (): Promise<DataSourceTypesResponse[]> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: APIEndpoints.DATA_SOURCE,
    });
    return resp as DataSourceTypesResponse[];
};

export const testConnection = async (
    dataSourceTypeId: string,
    ownerEntityId: string,
    ownerEntityType: UserType,
    secret: string,
): Promise<TestDataSourceConnectionResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.POST,
        headers: { 'Content-Type': 'application/json' },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: APIEndpoints.TEST_DATA_SOURCE,
        data: {
            dataSourceTypeId,
            ownerEntityId,
            ownerEntityType,
            secret,
        },
    });
    return resp as TestDataSourceConnectionResponse;
};
