import type { APIGatewayEvent, Handler } from 'aws-lambda';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { DataSourceTypeName, PrismaClient } from '@prisma/client';
import { v4 } from 'uuid';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { SQSClient, type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { GoogleDriveSQSMessageBody, GoogleDriveService } from '@joshuajohnsonjj38/google-drive';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);
const prisma = new PrismaClient();

export const handler: Handler = async (event: APIGatewayEvent) => {
    const messageData: { dataSourceId: string, userId: string } = JSON.parse(event.body as string);
    console.log(`Retreiving data source ${messageData.dataSourceId} Google Drive documents`, 'DataSource');

    const dataSource = await prisma.dataSource.findUniqueOrThrow({
        where: { id: messageData.dataSourceId },
        select: {
            id: true,
            secret: true,
            ownerEntityId: true,
            lastSync: true,
        },
    });

    const decryptedSecret = rsaService.decrypt(dataSource.secret);
    const googleDriveService = new GoogleDriveService(decryptedSecret);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    let isComplete = false;
    let nextCursor: string | null = null;
    while (!isComplete) {
        const resp = await googleDriveService.listFiles(nextCursor);
        resp.files.forEach((file) => {
            // Only process files created/edited since last sync
            if (!dataSource.lastSync || moment(dataSource.lastSync).isBefore(moment(file.modifiedTime))) {
                messageBatchEntries.push({
                    Id: file.id,
                    MessageBody: JSON.stringify({
                        fileId: file.id,
                        fileUrl: file.webViewLink,
                        ownerEntityId: dataSource.ownerEntityId,
                        fileName: file.name,
                        secret: dataSource.secret,
                        dataSourceId: dataSource.id,
                        modifiedDate: file.modifiedTime,
                    } as GoogleDriveSQSMessageBody),
                    MessageGroupId: messageGroupId,
                });
            } else {
                isComplete = true;
            }
        });

        if (!isComplete) {
            isComplete = !resp.nextPageToken;
            nextCursor = resp.nextPageToken ?? null;
        }
    }

    const sqsClient = new SQSClient({
        region: process.env.AWS_REGION as string,
    });

    await sendSqsMessageBatches(
        sqsClient,
        messageBatchEntries,
        process.env.GOOGLE_DRIVE_QUEUE_URL as string,
        dataSource.id,
        DataSourceTypeName.GOOGLE_DRIVE,
        true,
        messageData.userId,
    );
};
