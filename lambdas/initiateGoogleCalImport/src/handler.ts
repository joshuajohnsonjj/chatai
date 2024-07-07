import type { Handler } from 'aws-lambda';
import { v4 } from 'uuid';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { type InitiateImportWithOAuthRequestData } from '../../lib/types';
import { GoogleCalService, type GoogleCalSQSMessageBody } from '../../lib/dataSources/googleCal';
import { notifyImportStarted } from '../../lib/internalAPI';

export const handler: Handler = async (event): Promise<{ success: boolean }> => {
    const messageData: InitiateImportWithOAuthRequestData = event.body;

    console.log(`Retreiving data source ${messageData.dataSourceId} Google calendars`);

    const googleCalService = new GoogleCalService(messageData.secret, messageData.refreshToken);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    try {
        await notifyImportStarted(messageData.dataSourceId);
    } catch (e) {
        console.error(e);
        return { success: false };
    }

    let isComplete = false;
    let nextCursor: string | undefined;
    let ndx = 0;

    while (!isComplete) {
        const resp = await googleCalService.getCalList(nextCursor);

        console.log(`Retrieved page batch ${ndx++} of results for data source ${messageData.dataSourceId}`);

        resp.items.forEach((item) => {
            messageBatchEntries.push({
                Id: item.id,
                MessageBody: JSON.stringify({
                    calId: item.id,
                    ownerEntityId: messageData.ownerEntityId,
                    secret: messageData.secret,
                    refreshToken: messageData.refreshToken,
                    dataSourceId: messageData.dataSourceId,
                    lowerDateBound: messageData.lastSync,
                } as GoogleCalSQSMessageBody),
                MessageGroupId: messageGroupId,
            });
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

    await sendSqsMessageBatches(messageBatchEntries, process.env.GOOGLE_CAL_QUEUE_URL!);

    return { success: true };
};
