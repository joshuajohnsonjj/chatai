import { APIGatewayEvent, Handler } from 'aws-lambda';
import { PrismaClient } from '@joshuajohnsonjj38/prisma';
import { SlackEventAPIPayload, SlackWrapper } from '@joshuajohnsonjj38/slack';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantDataSource, QdrantPayload, QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const openAI = new OpenAIWrapper(process.env.OPENAI_SECRET as string);
const qdrant = new QdrantWrapper(
    process.env.QDRANT_HOST as string,
    process.env.QDRANT_COLLECTION as string,
    process.env.QDRANT_KEY as string,
);
const rsaService = new RsaCipher();
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

// TODO: check best way to keep connection open
/**
 *
 * Receives HTTP events for slack message postings
 *
 */
export const handler: Handler = async (event: APIGatewayEvent) => {
    const messageData: SlackEventAPIPayload = JSON.parse(event.body as string);

    const dataSource = await prisma.dataSource.findUniqueOrThrow({
        where: { externalId: messageData.api_app_id },
        select: {
            id: true,
            ownerEntityId: true,
            secret: true,
        },
    });

    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    const slackKey = rsaService.decrypt(dataSource.secret);
    const slackService = new SlackWrapper(slackKey, redisClient);

    const [userInfo, channelInfo] = await Promise.all([
        slackService.getUserInfoById(messageData.event.user),
        slackService.getChannelInfoById(messageData.event.channel),
    ]);

    const payload: QdrantPayload = {
        date: new Date(messageData.event.ts).getTime(),
        text: messageData.event.text,
        dataSource: QdrantDataSource.SLACK,
        ownerId: dataSource.ownerEntityId,
        slackChannelId: messageData.event.channel,
        slackChannelName: channelInfo.name,
        authorName: userInfo.real_name,
    };

    const embedding = await openAI.getTextEmbedding(messageData.event.text);
    await qdrant.upsert(`${messageData.event.channel}:${messageData.event.ts}`, embedding, payload);
    await prisma.dataSource.update({
        where: {
            id: dataSource.id,
        },
        data: {
            lastSync: new Date(),
            updatedAt: new Date(),
        },
    });
};
