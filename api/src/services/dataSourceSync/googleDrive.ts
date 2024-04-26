import type { SQSClient, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { GoogleDriveSQSMessageBody, GoogleDriveService } from '@joshuajohnsonjj38/google-drive';
import * as moment from 'moment';
import { v4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { sendSqsMessageBatches } from '../sqs';
import { DataSourceTypeName } from '@prisma/client';

export const initGoogleDriveSync = async (
    logger: Logger,
    sqsClient: SQSClient,
    decryptedSecret: string,
    notionQueueUrl: string,
    encryptedSecret: string,
    ownerEntityId: string,
    lastSync: Date | null,
    dataSourceId: string,
    userId: string,
    shouldInitiateWebhook: boolean,
): Promise<void> => {
    logger.log(`Retreiving data source ${dataSourceId} Google Drive documents`, 'DataSource');

    const googleDriveService = new GoogleDriveService(decryptedSecret);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    let isComplete = false;
    let nextCursor: string | null = null;
    while (!isComplete) {
        const resp = await googleDriveService.listFiles(nextCursor);
        resp.files.forEach((file) => {
            // Only process files created/edited since last sync
            if (!lastSync || moment(lastSync).isBefore(moment(file.modifiedTime))) {
                messageBatchEntries.push({
                    Id: file.id,
                    MessageBody: JSON.stringify({
                        fileId: file.id,
                        fileUrl: file.webViewLink,
                        ownerEntityId: ownerEntityId,
                        fileName: file.name,
                        secret: encryptedSecret,
                        dataSourceId,
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

    sendSqsMessageBatches(
        sqsClient,
        messageBatchEntries,
        notionQueueUrl,
        dataSourceId,
        DataSourceTypeName.GOOGLE_DRIVE,
        shouldInitiateWebhook,
        userId,
    );
};
