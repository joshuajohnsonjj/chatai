import { NotionWrapper, getPageTitle } from '@joshuajohnsonjj38/notion';
import type { NotionSQSMessageBody } from '@joshuajohnsonjj38/notion';
import type { Handler } from 'aws-lambda';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { type InitiateImportRequestData } from '../../lib/types';
import { v4 } from 'uuid';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);

/**
 * API Gateway /notion POST handler
 */
export const handler: Handler = async (req): Promise<{ success: boolean }> => {
    const data: InitiateImportRequestData = req.body;
    console.log(`Retreiving data source ${data.dataSourceId} Notion pages`, 'DataSource');

    const decryptedSecret = rsaService.decrypt(data.secret);
    const notionService = new NotionWrapper(decryptedSecret);
    const messageGroupId = v4();
    const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

    let isComplete = false;
    let nextCursor: string | null = null;
    let ndx = 1;

    while (!isComplete) {
        const resp = await notionService.listPages(nextCursor);

        console.log(`Retrieved page ${ndx++} of results for data source ${data.dataSourceId}`);

        resp.results.forEach((page) => {
            // Only process pages created/edited since last sync
            if (!data.lastSync || moment(data.lastSync).isBefore(moment(page.last_edited_time))) {
                messageBatchEntries.push({
                    Id: page.id,
                    MessageBody: JSON.stringify({
                        pageId: page.id,
                        pageUrl: page.url,
                        ownerEntityId: data.ownerEntityId,
                        pageTitle: getPageTitle(page),
                        secret: data.secret,
                        dataSourceId: data.dataSourceId,
                        isFinal: false,
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

    messageBatchEntries[messageBatchEntries.length - 1].MessageBody = JSON.stringify({
        ...JSON.parse(messageBatchEntries[messageBatchEntries.length - 1].MessageBody as string),
        isFinal: true,
    });

    await sendSqsMessageBatches(messageBatchEntries, process.env.NOTION_QUEUE_URL as string);

    return { success: true };
};
