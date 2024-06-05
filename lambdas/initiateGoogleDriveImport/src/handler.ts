import type { Handler } from 'aws-lambda';
import { decryptData } from '../../lib/decryption';
import { InternalAPIEndpoints } from '../../lib/constants';
import { v4 } from 'uuid';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { type InitiateImportWithOAuthRequestData } from '../../lib/types';
import { GoogleDriveSQSMessageBody, GoogleDriveService } from '../../lib/dataSources/googleDrive';
import axios from 'axios';

dotenv.config({ path: __dirname + '/../../../../.env' });

export const handler: Handler = async (event): Promise<{ success: boolean }> => {
    const messageData: InitiateImportWithOAuthRequestData = event.body;

    console.log(`Retreiving data source ${messageData.dataSourceId} Google Drive documents`);

    const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, messageData.secret);
    const googleDriveService = new GoogleDriveService(decryptedSecret, messageData.refreshToken);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    try {
        await axios({
            method: 'patch',
            baseURL: process.env.INTERNAL_BASE_API_HOST!,
            url: InternalAPIEndpoints.STARTING_IMPORTS,
            data: { dataSourceId: messageData.dataSourceId },
            headers: {
                'api-key': process.env.INTERNAL_API_KEY!,
            },
        });
    } catch (e) {
        console.warn(e);
        return { success: false };
    }

    let isComplete = false;
    let nextCursor: string | null = null;
    let ndx = 0;

    while (!isComplete) {
        const resp = await googleDriveService.listFiles(nextCursor);

        console.log(`Retrieved page batch ${ndx++} of results for data source ${messageData.dataSourceId}`);

        resp.files.forEach((file) => {
            // TODO: eventually can we handle other types of documents?
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
                        userId: messageData.userId,
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

    console.log(
        `Done getting pages for for data source ${messageData.dataSourceId}, publishing sqs message batches...`,
    );

    // Set is final true on last message entry for job completion handling
    messageBatchEntries[messageBatchEntries.length - 1].MessageBody = JSON.stringify({
        ...JSON.parse(messageBatchEntries[messageBatchEntries.length - 1].MessageBody as string),
        isFinal: true,
    });

    await sendSqsMessageBatches(messageBatchEntries, process.env.GOOGLE_DRIVE_QUEUE_URL as string);

    return { success: true };
};
