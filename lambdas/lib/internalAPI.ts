import axios from 'axios';
import { InternalAPIEndpoints } from './constants';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../../.env' });

export const notifyImportStarted = async (dataSourceId: string): Promise<void> => {
    await axios({
        method: 'patch',
        baseURL: process.env.INTERNAL_BASE_API_HOST!,
        url: InternalAPIEndpoints.STARTING_IMPORTS,
        data: { dataSourceId },
        headers: { 'api-key': process.env.INTERNAL_API_KEY! },
    });
};

export const notifyImportsCompleted = async (
    completedIds: string[],
    storageUsageMapCache: { [dataSourceId: string]: number },
): Promise<void> => {
    await axios({
        method: 'patch',
        baseURL: process.env.INTERNAL_BASE_API_HOST!,
        url: InternalAPIEndpoints.COMPLETED_IMPORTS,
        data: {
            completed: completedIds.map((id) => ({
                dataSourceId: id,
                bytesDelta: storageUsageMapCache[id] ?? 0,
            })),
        },
        headers: { 'api-key': process.env.INTERNAL_API_KEY! },
    });
};

export const refreshGoogleOAuthToken = async (refreshToken: string): Promise<string> => {
    const res = await axios({
        method: 'get',
        baseURL: process.env.INTERNAL_BASE_API_HOST!,
        url: `${InternalAPIEndpoints.GOOGLE_AUTH_REFRESH}?r=${refreshToken}`,
    });
    return res.data.accessToken;
};
