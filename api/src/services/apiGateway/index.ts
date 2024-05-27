import { type DataSourceTypeName } from '@prisma/client';
import axios from 'axios';
import { snakeCase } from 'lodash';
import { APIGatewayTestCredentialsParams, type APIGatewayInitiateImportParams } from 'src/types';

enum APIGatewayEndpoints {
    TEST_CONN = 'test-credentials',
}

export const initiateDataSourceImport = async (
    baseURL: string,
    apiKey: string,
    dataSourceType: DataSourceTypeName,
    data: APIGatewayInitiateImportParams,
): Promise<void> => {
    await axios({
        baseURL,
        url: snakeCase(dataSourceType),
        method: 'post',
        data,
        headers: {
            'x-api-key': apiKey,
        },
    });
};

export const testDataSourceConnection = async (
    baseURL: string,
    apiKey: string,
    data: APIGatewayTestCredentialsParams,
): Promise<{ isValid: boolean; message: string }> => {
    return await axios({
        baseURL,
        url: APIGatewayEndpoints.TEST_CONN,
        method: 'post',
        data,
        headers: {
            'x-api-key': apiKey,
        },
    });
};
