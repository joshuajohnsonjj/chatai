import type { Handler } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: __dirname + '/../.env' });
const prisma = new PrismaClient();

export const handler: Handler = async (req) => {
    const dataSourceId: string = req.body.dataSourceId;

    console.log(`Updating data source ${dataSourceId}`);

    await prisma.dataSource.update({
        where: {
            id: dataSourceId,
        },
        data: {
            lastSync: new Date(),
            isSyncing: false,
            updatedAt: new Date(),
        },
    });
};
