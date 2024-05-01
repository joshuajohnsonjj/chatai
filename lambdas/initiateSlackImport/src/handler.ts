import type { APIGatewayEvent, Handler } from 'aws-lambda';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { DataSourceTypeName, PrismaClient } from '@prisma/client';
import { v4 } from 'uuid';
import * as dotenv from 'dotenv';
import { SQSClient, type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { SlackWrapper } from '@joshuajohnsonjj38/slack';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);
const prisma = new PrismaClient();

export const handler: Handler = async (event: APIGatewayEvent) => {
    const messageData: { dataSourceId: string } = JSON.parse(event.body as string);
    console.log(`Retreiving data source ${messageData.dataSourceId} slack channels`, 'DataSource');

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
                    ownerEntityId: dataSource.ownerEntityId,
                    secret: dataSource.secret,
                    dataSourceId: dataSource.id,
                }),
                MessageGroupId: messageGroupId,
            });
        });

        if (!isComplete) {
            isComplete = !resp?.response_metadata?.next_cursor;
            nextCursor = resp?.response_metadata?.next_cursor;
        }
    }

    const sqsClient = new SQSClient({
        region: process.env.AWS_REGION as string,
    });

    await sendSqsMessageBatches(
        sqsClient,
        messageBatchEntries,
        process.env.SLACK_QUEUE_URL as string,
        dataSource.id,
        DataSourceTypeName.SLACK,
    );
};
