import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { Handler, SQSEvent } from 'aws-lambda';
import { PrismaClient } from '@joshuajohnsonjj38/prisma';
import { type SlackMessage, SlackWrapper } from '@joshuajohnsonjj38/slack';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantDataSource, QdrantPayload, QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import { createClient } from 'redis';

const rsaService = new RsaCipher('./private.pem');
const prisma = new PrismaClient();
const openAI = new OpenAIWrapper(process.env.OPENAI_SECRET as string);
const qdrant = new QdrantWrapper(
    process.env.QDRANT_HOST as string,
    parseInt(process.env.QDRANT_PORT as string, 10),
    process.env.QDRANT_COLLECTION as string,
);
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

const processMessages = async (
    slackAPI: SlackWrapper,
    messages: SlackMessage[],
    channelId: string,
    channelName: string,
    ownerId: string,
): Promise<void> => {
    await Promise.all(
        messages.map(async (message) => {
            const payload: QdrantPayload = {
                date: new Date(message.ts).getTime(),
                text: message.text,
                dataSource: QdrantDataSource.SLACK,
                ownerId,
                slackChannelId: channelId,
                slackChannelName: channelName,
                authorName: (await slackAPI.getUserInfoById(message.user)).real_name,
            };

            const embedding = await openAI.getTextEmbedding(message.text);
            await qdrant.upsert(`${channelId}:${message.ts}`, embedding, payload);
        }),
    );
};

const processChannel = async (
    slackAPI: SlackWrapper,
    channelId: string,
    channelName: string,
    ownerEntityId: string,
) => {
    let isComplete = false;
    let nextCursor: string | null = null;
    const processingMessagesPromises: Promise<void>[] = [];

    while (!isComplete) {
        const messagesResponse = await slackAPI.getConversationHistory(channelId, nextCursor);
        processingMessagesPromises.push(
            processMessages(slackAPI, messagesResponse.messages, channelId, channelName, ownerEntityId),
        );
        isComplete = !messagesResponse.has_more;
        nextCursor = messagesResponse?.response_metadata?.next_cursor;
    }

    await Promise.all(processingMessagesPromises);
};

/**
 * Lambda SQS handler
 *
 * Message body expected to have following data
 *      channelId: string,
 *      channelName: string,
 *      ownerEntityId: string,
 *      dataSourceId: string,
 *      secret: string,
 *
 * Or at the end of a data source's sync messages
 *      dataSourceId: string,
 *      isFinal: true,
 */
export const handler: Handler = async (event: SQSEvent) => {
    const processingChannelPromises: Promise<void>[] = [];
    const completedDataSources: string[] = [];

    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        if (messageBody.isFinal) {
            completedDataSources.push(messageBody.dataSourceId);
            continue;
        }

        const slackKey = rsaService.decrypt(messageBody.secret);
        const slackAPI = new SlackWrapper(slackKey, redisClient);

        processingChannelPromises.push(
            processChannel(slackAPI, messageBody.channelId, messageBody.channelName, messageBody.ownerEntityId),
        );
    }

    await Promise.all(processingChannelPromises);
    await prisma.dataSource.updateMany({
        where: {
            id: {
                in: completedDataSources,
            },
        },
        data: {
            lastSync: new Date(),
            isSyncing: false,
            updatedAt: new Date(),
        },
    });
};
