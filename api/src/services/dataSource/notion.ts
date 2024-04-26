import type { SQSClient, SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { getPageTitle, type NotionSQSMessageBody, NotionWrapper } from '@joshuajohnsonjj38/notion';
import * as moment from 'moment';
import { v4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { sendSqsMessageBatches } from '../sqs';

export const initNotionSync = async (
    logger: Logger,
    sqsClient: SQSClient,
    decryptedSecret: string,
    notionQueueUrl: string,
    encryptedSecret: string,
    ownerEntityId: string,
    lastSync: Date | null,
    dataSourceId: string,
): Promise<void> => {
    logger.log(`Retreiving data source ${dataSourceId} Notion pages`, 'DataSource');

    const notionService = new NotionWrapper(decryptedSecret);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    let isComplete = false;
    let nextCursor: string | null = null;
    while (!isComplete) {
        const resp = await notionService.listPages(nextCursor);
        resp.results.forEach((page) => {
            // Only process pages created/edited since last sync
            if (!lastSync || moment(lastSync).isBefore(moment(page.last_edited_time))) {
                messageBatchEntries.push({
                    Id: page.id,
                    MessageBody: JSON.stringify({
                        pageId: page.id,
                        pageUrl: page.url,
                        ownerEntityId: ownerEntityId,
                        pageTitle: getPageTitle(page),
                        secret: encryptedSecret,
                        dataSourceId,
                    } as NotionSQSMessageBody),
                    MessageGroupId: messageGroupId,
                });
            } else {
                isComplete = true;
            }
        });

        if (!isComplete) {
            isComplete = !resp.has_more;
            nextCursor = resp.next_cursor;
        }
    }

    sendSqsMessageBatches(sqsClient, messageBatchEntries, notionQueueUrl, dataSourceId);
};
