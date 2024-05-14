import type { APIGatewayEvent, Handler } from 'aws-lambda';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { v4 } from 'uuid';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { InitiateImportRequestData } from '../../lib/types';
import { GoogleDriveSQSMessageBody, GoogleDriveService } from '@joshuajohnsonjj38/google-drive';

dotenv.config({ path: __dirname + '/../../../../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);

export const handler: Handler = async (event): Promise<{ success: boolean }> => {
    const messageData: InitiateImportRequestData = event.body;
    console.log(`Retreiving data source ${messageData.dataSourceId} Google Drive documents`);

    const decryptedSecret = rsaService.decrypt(messageData.secret);
    const googleDriveService = new GoogleDriveService(decryptedSecret);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    let isComplete = false;
    let nextCursor: string | null = null;
    while (!isComplete) {
        const resp = await googleDriveService.listFiles(nextCursor);
        resp.files.forEach((file) => {
            if (!file.webViewLink.startsWith('https://docs.google.com/document')) {
                return;
            }

            // Only process files created/edited since last sync
            if (!messageData.lastSync || moment(messageData.lastSync).isBefore(moment(file.modifiedTime))) {
                messageBatchEntries.push({
                    Id: file.id,
                    MessageBody: JSON.stringify({
                        fileId: file.id,
                        fileUrl: file.webViewLink,
                        ownerEntityId: messageData.ownerEntityId,
                        fileName: file.name,
                        secret: messageData.secret,
                        dataSourceId: messageData.dataSourceId,
                        modifiedDate: file.modifiedTime,
                        authorName: file.lastModifyingUser?.displayName,
                        authorEmail: file.lastModifyingUser?.emailAddress,
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

    // TODO: add is final message

    await sendSqsMessageBatches(messageBatchEntries, process.env.GOOGLE_DRIVE_QUEUE_URL as string);

    return { success: true };
};
