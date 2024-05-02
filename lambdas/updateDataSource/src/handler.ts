import type { Handler, SQSEvent } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: __dirname + '/../.env' });
const prisma = new PrismaClient();

/**
 * Event record body contains one key value pair dataSourceIds: string[]
 */
export const handler: Handler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);
        console.log(`Updating data source ${messageBody.dataSourceIds}`);

        await prisma.dataSource.updateMany({
            where: {
                id: {
                    in: messageBody.dataSourceIds,
                },
            },
            data: {
                lastSync: new Date(),
                isSyncing: false,
                updatedAt: new Date(),
            },
        });
    }
};
