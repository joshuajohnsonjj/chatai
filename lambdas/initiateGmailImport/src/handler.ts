import type { Handler } from 'aws-lambda';
import { v4 } from 'uuid';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { type InitiateImportWithOAuthRequestData } from '../../lib/types';
import { type GmailSQSMessageBody, GmailService } from '../../lib/dataSources/gmail';
import { notifyImportStarted } from '../../lib/internalAPI';

export const handler: Handler = async (event): Promise<{ success: boolean }> => {
    const messageData: InitiateImportWithOAuthRequestData = event.body;

    console.log(`Retreiving data source ${messageData.dataSourceId} Gmail threads`);

    const service = new GmailService(messageData.secret, messageData.refreshToken);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    try {
        await notifyImportStarted(messageData.dataSourceId);
    } catch (e) {
        console.error(e);
        return { success: false };
    }

    let isComplete = false;
    let nextCursor;
    let ndx = 0;

    while (!isComplete) {
        const resp = await service.listThreads(
            messageData.externalId!,
            messageData.lastSync ? new Date(messageData.lastSync) : undefined,
            nextCursor,
        );

        console.log(`Retrieved page batch ${ndx++} of results for data source ${messageData.dataSourceId}`);

        resp.threads.forEach((thread) => {
            messageBatchEntries.push({
                Id: thread.id,
                MessageBody: JSON.stringify({
                    threadId: thread.id,
                    ownerEntityId: messageData.ownerEntityId,
                    secret: messageData.secret,
                    refreshToken: messageData.refreshToken,
                    dataSourceId: messageData.dataSourceId,
                    userEmail: messageData.externalId!,
                    isFinal: false,
                } as GmailSQSMessageBody),
                MessageGroupId: messageGroupId,
            });
        });

        if (!isComplete) {
            isComplete = !resp.nextPageToken;
            nextCursor = resp.nextPageToken;
        }
    }

    console.log(
        `Done getting pages for for data source ${messageData.dataSourceId}, publishing sqs message batches...`,
    );

    // Set is final true on last message entry for job completion handling
    messageBatchEntries[messageBatchEntries.length - 1].MessageBody = JSON.stringify({
        ...JSON.parse(messageBatchEntries[messageBatchEntries.length - 1].MessageBody!),
        isFinal: true,
    });

    await sendSqsMessageBatches(messageBatchEntries, process.env.GMAIL_QUEUE_URL!);

    return { success: true };
};
