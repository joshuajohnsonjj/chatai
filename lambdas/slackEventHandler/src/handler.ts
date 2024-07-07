import type { Handler, SQSEvent } from 'aws-lambda';
import { type SlackEventSQSMessageBody, type UserInfo, SlackService } from '../../lib/dataSources/slack';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { decryptData } from '../../lib/decryption';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import type { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import * as dotenv from 'dotenv';
import { getDocumentSizeEstimate } from '../../lib/helper';
import { notifyImportsCompleted } from '../../lib/internalAPI';

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

const processDeletionEvent = async (mongo: MongoDBService, messageBody: SlackEventSQSMessageBody) => {
    const document = await mongo.elementCollConnection.findOneAndDelete({
        _id: `${messageBody.channelId}-${messageBody.ts}`,
        ownerEntityId: messageBody.ownerEntityId,
    });

    if (!document) {
        return;
    }

    const documentSize = getDocumentSizeEstimate(document.text.length, true);
    storageUsageMapCache[messageBody.dataSourceId] = storageUsageMapCache[messageBody.dataSourceId]
        ? storageUsageMapCache[messageBody.dataSourceId] - documentSize
        : 0 - documentSize;
};

const processEvent = async (mongo: MongoDBService, service: SlackService, messageBody: SlackEventSQSMessageBody) => {
    const channelInfo = await service.getChannelInfoById(messageBody.channelId);

    const [embedding, annotationsResponse, user, messageLink] = await Promise.all([
        gemini.getTextEmbedding(`Slack message in channel: ${channelInfo.name}. ${messageBody.text}`),
        gemini.getTextAnnotation(messageBody.text, 0.41, 0.88),
        getUserInfo(service, messageBody.userId),
        service.getMessageLink(messageBody.channelId, messageBody.ts),
    ]);

    const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

    const [writeElementsSummary] = await Promise.all([
        mongo.writeDataElements({
            _id: `${messageBody.channelId}-${messageBody.ts}`,
            ownerEntityId: messageBody.ownerEntityId,
            text: messageBody.text,
            title: `${channelInfo.name} - ${user.name}`,
            embedding,
            createdAt: new Date().getTime(),
            modifiedAt: parseFloat(messageBody.edited ? messageBody.edited.ts : messageBody.ts) * 1000,
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
            entityId: messageBody.ownerEntityId,
        }),
        mongo.writeLabels(annotations, messageBody.ownerEntityId),
    ]);

    const documentSize = getDocumentSizeEstimate(writeElementsSummary.lengthDiff, writeElementsSummary.isNew);
    storageUsageMapCache[messageBody.dataSourceId] = storageUsageMapCache[messageBody.dataSourceId]
        ? storageUsageMapCache[messageBody.dataSourceId] + documentSize
        : 0 + documentSize;
};

/**
 * Handles SQS queue of HTTP events for slack message postings
 *
 */
export const handler: Handler = async (event: SQSEvent) => {
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

    const uniqueDataSources: Set<string> = new Set();

    await Promise.all(
        event.Records.map(async (record) => {
            const messageBody: SlackEventSQSMessageBody = JSON.parse(record.body);

            uniqueDataSources.add(messageBody.dataSourceId);

            const slackService = new SlackService(decryptData(process.env.RSA_PRIVATE_KEY!, messageBody.secret));

            if (!messageBody.isDeletion) {
                await processEvent(mongo, slackService, messageBody);
            } else {
                await processDeletionEvent(mongo, messageBody);
            }
        }),
    );

    console.log('Sync completed of data source records:', uniqueDataSources);
    await notifyImportsCompleted(Array.from(uniqueDataSources), storageUsageMapCache);

    return { success: true };
};
