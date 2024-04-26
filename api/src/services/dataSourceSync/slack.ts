import type { SQSClient, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { v4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { sendSqsMessageBatches } from '../sqs';
import { SlackWrapper } from '@joshuajohnsonjj38/slack';
import { DataSourceTypeName } from '@prisma/client';

export const initSlackSync = async (
    logger: Logger,
    sqsClient: SQSClient,
    decryptedSecret: string,
    slackQueueUrl: string,
    encryptedSecret: string,
    ownerEntityId: string,
    dataSourceId: string,
): Promise<void> => {
    logger.log(`Retreiving data source ${dataSourceId} Slack channels`, 'DataSource');

    const slackService = new SlackWrapper(decryptedSecret);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    let isComplete = false;
    let nextCursor: string | null = null;
    while (!isComplete) {
        const resp = await slackService.listConversations(nextCursor);
        // TODO: check last sync time of data source, might have to do this on lambda side...
        resp.channels.forEach((channel) => {
            messageBatchEntries.push({
                Id: channel.id,
                MessageBody: JSON.stringify({
                    channelId: channel.id,
                    channelName: channel.name,
                    ownerEntityId: ownerEntityId,
                    secret: encryptedSecret,
                    dataSourceId,
                }),
                MessageGroupId: messageGroupId,
            });
        });

        if (!isComplete) {
            isComplete = !resp?.response_metadata?.next_cursor;
            nextCursor = resp?.response_metadata?.next_cursor;
        }
    }

    sendSqsMessageBatches(sqsClient, messageBatchEntries, slackQueueUrl, dataSourceId, DataSourceTypeName.SLACK);
};
