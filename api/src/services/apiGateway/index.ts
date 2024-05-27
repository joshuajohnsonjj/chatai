import { type DataSourceTypeName } from '@prisma/client';
import axios from 'axios';
import { snakeCase } from 'lodash';
import { APIGatewayTestCredentialsParams, type APIGatewayInitiateImportParams } from 'src/types';

enum APIGatewayEndpoints {
    TEST_CONN = 'test-credentials',
    GOOGLE_DRIVE_WEBHOOK = 'google-drive/webhook',
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

/**
 * secret always required
 *
 * for create operation ownerEntityId required
 * for delete operation connectionId, resourceId required
 */
export const modifyGoogleDriveWebhookConnection = async (
    baseURL: string,
    apiKey: string,
    isCreate: boolean,
    data: {
        secret: string;
        ownerEntityId?: string;
        connectionId?: string;
        resourceId?: string;
    },
): Promise<{
    success: boolean;
    id: string;
    resourceId: string;
}> => {
    return await axios({
        baseURL,
        url: APIGatewayEndpoints.GOOGLE_DRIVE_WEBHOOK,
        method: isCreate ? 'post' : 'delete',
        data,
        headers: {
            'x-api-key': apiKey,
        },
    });
};
