import type { APIGatewayEvent, Handler } from 'aws-lambda';
import { decryptData } from '../../lib/descryption';
import { PrismaClient } from '@prisma/client';
import { v4 } from 'uuid';
import * as dotenv from 'dotenv';
import { type SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs';
import { sendSqsMessageBatches } from '../../lib/sqs';
import { SlackWrapper } from '../../lib/dataSources/slack';

dotenv.config({ path: __dirname + '/../.env' });

const prisma = new PrismaClient();

export const handler: Handler = async (event: APIGatewayEvent) => {
    const messageData: { dataSourceId: string } = JSON.parse(event.body as string);
    console.log(`Retreiving data source ${messageData.dataSourceId} slack channels`, 'DataSource');

    // TODO: remove
    const dataSource = await prisma.dataSource.findUniqueOrThrow({
        where: { id: messageData.dataSourceId },
        select: {
            id: true,
            secret: true,
            ownerEntityId: true,
            lastSync: true,
        },
    });

    const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, dataSource.secret);
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

    await sendSqsMessageBatches(messageBatchEntries, process.env.SLACK_QUEUE_URL!);
};
