import type { Handler } from 'aws-lambda';
import { decryptData } from '../../lib/decryption';
import { v4 } from 'uuid';
import * as dotenv from 'dotenv';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { SlackService } from '../../lib/dataSources/slack';
import { notifyImportStarted } from '../../lib/internalAPI';
import { type InitiateImportRequestData } from '../../lib/types';

dotenv.config({ path: __dirname + '/../.env' });

export const handler: Handler = async (event) => {
    const messageData: InitiateImportRequestData = event.body;

    console.log(`Retreiving data source ${messageData.dataSourceId} Slack channels`);

    const slackService = new SlackService(decryptData(process.env.RSA_PRIVATE_KEY!, messageData.secret));
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
    const ndx = 0;

    while (!isComplete) {
        console.log(`Retrieving page ${ndx} of channels from data source ${messageData.dataSourceId}`);

        const resp = await slackService.listConversations(nextCursor);
        resp.channels.forEach((channel) => {
            messageBatchEntries.push({
                Id: channel.id,
                MessageBody: JSON.stringify({
                    channelId: channel.id,
                    channelName: channel.name,
                    ownerEntityId: messageData.ownerEntityId,
                    secret: messageData.secret,
                    dataSourceId: messageData.dataSourceId,
                    lowerDateBound: messageData.lastSync,
                }),
                MessageGroupId: messageGroupId,
            });
        });

        if (!isComplete) {
            isComplete = !resp?.response_metadata?.next_cursor;
            nextCursor = resp?.response_metadata?.next_cursor;
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

    await sendSqsMessageBatches(messageBatchEntries, process.env.SLACK_QUEUE_URL!);

    return { success: true };
};
