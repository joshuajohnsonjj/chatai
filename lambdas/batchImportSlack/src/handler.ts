import { Handler, SQSEvent } from 'aws-lambda';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import * as dotenv from 'dotenv';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { SlackService, type SlackSQSMessageBody, type SlackMessage } from '../../lib/dataSources/slack';
import { decryptData } from '../../lib/decryption';
import { notifyImportsCompleted } from '../../lib/internalAPI';
import { type MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { type UserInfo } from './types';
import { getDocumentSizeEstimate } from '../../lib/helper';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

let storageUsageMapCache: { [dataSourceId: string]: number };
let userIdToInfoCache: { [userId: string]: UserInfo };

const getUserInfo = async (service: SlackService, userId: string): Promise<UserInfo> => {
    if (userIdToInfoCache[userId]) {
        return userIdToInfoCache[userId];
    }

    const res = await service.getUserInfoById(userId);
    userIdToInfoCache[userId] = {
        name: res.real_name,
        email: res.profile.email,
    };

    return userIdToInfoCache[userId];
};

const processMessages = async (
    mongo: MongoDBService,
    service: SlackService,
    messages: SlackMessage[],
    sqsMessageBody: SlackSQSMessageBody,
): Promise<void> => {
    await Promise.all(
        messages.map(async (message) => {
            const [embedding, annotationsResponse, user, messageLink] = await Promise.all([
                gemini.getTextEmbedding(`Slack message in channel: ${sqsMessageBody.channelName}. ${message.text}`),
                gemini.getTextAnnotation(message.text, 0.41, 0.88),
                getUserInfo(service, message.user),
                service.getMessageLink(sqsMessageBody.channelId, message.ts),
            ]);

            const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

            const [writeElementsSummary] = await Promise.all([
                mongo.writeDataElements({
                    _id: `${sqsMessageBody.channelId}-${message.ts}`,
                    ownerEntityId: sqsMessageBody.ownerEntityId,
                    text: message.text,
                    title: `${sqsMessageBody.channelName} - ${user.name}`,
                    embedding,
                    createdAt: new Date().getTime(),
                    modifiedAt: parseFloat(message.ts) * 1000,
                    url: messageLink,
                    author: {
                        name: user.name,
                        email: user.email,
                    },
                    annotations,
                    dataSourceType: SlackService.DataSourceTypeName,
                }),
                mongo.writeAuthors({
                    name: user.name,
                    email: user.email,
                    entityId: sqsMessageBody.ownerEntityId,
                }),
                mongo.writeLabels(annotations, sqsMessageBody.ownerEntityId),
            ]);

            storageUsageMapCache[sqsMessageBody.dataSourceId] =
                storageUsageMapCache[sqsMessageBody.dataSourceId] ??
                0 + getDocumentSizeEstimate(writeElementsSummary.lengthDiff, writeElementsSummary.isNew);
        }),
    );
};

const processChannel = async (mongo: MongoDBService, service: SlackService, messageBody: SlackSQSMessageBody) => {
    let isComplete = false;
    let nextCursor: string | undefined;
    const processingMessagesPromises: Promise<void>[] = [];

    while (!isComplete) {
        const messagesResponse = await service.getConversationHistory(
            messageBody.channelId,
            messageBody.lowerDateBound,
            nextCursor,
        );
        processingMessagesPromises.push(processMessages(mongo, service, messagesResponse.messages, messageBody));
        isComplete = !messagesResponse.has_more;
        nextCursor = messagesResponse?.response_metadata?.next_cursor;
    }

    await Promise.all(processingMessagesPromises);
};

/**
 * Lambda SQS handler
 */
export const handler: Handler = async (event: SQSEvent) => {
    const completedDataSources: string[] = [];

    const mongo = await getMongoClientFromCacheOrInitiateConnection(
        process.env.MONGO_CONN_STRING!,
        process.env.MONGO_DB_NAME!,
    );

    console.log(`Processing ${event.Records.length} messages`);

    if (!storageUsageMapCache) {
        console.log('Initializing storage map cache');
        storageUsageMapCache = {};
    }

    if (!userIdToInfoCache) {
        console.log('Initializing user info map cache');
        userIdToInfoCache = {};
    }

    await Promise.all(
        event.Records.map(async (record) => {
            const messageBody: SlackSQSMessageBody = JSON.parse(record.body);

            if (messageBody.isFinal) {
                completedDataSources.push(messageBody.dataSourceId);
            }

            const slackService = new SlackService(decryptData(process.env.RSA_PRIVATE_KEY!, messageBody.secret));

            await processChannel(mongo, slackService, messageBody);
        }),
    );

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);
        await notifyImportsCompleted(completedDataSources, storageUsageMapCache);
    }

    return { success: true };
};
