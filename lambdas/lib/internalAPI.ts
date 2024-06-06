import axios from 'axios';
import { InternalAPIEndpoints } from './constants';
import * as dotenv from 'dotenv';
import { GoogleDriveSQSMessageBody } from './dataSources/googleDrive';

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
    completed: GoogleDriveSQSMessageBody[],
    storageUsageMapCache: { [dataSourceId: string]: number },
): Promise<void> => {
    await axios({
        method: 'patch',
        baseURL: process.env.INTERNAL_BASE_API_HOST!,
        url: InternalAPIEndpoints.COMPLETED_IMPORTS,
        data: {
            completed: completed.map((message) => ({
                dataSourceId: message.dataSourceId,
                bytesDelta: storageUsageMapCache[message.dataSourceId] ?? 0,
                userId: message.userId,
            })),
        },
        headers: { 'api-key': process.env.INTERNAL_API_KEY! },
    });
};
