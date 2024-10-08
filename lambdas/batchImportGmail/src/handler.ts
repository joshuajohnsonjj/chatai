import type { Handler, SQSEvent } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { type GetThreadResponse, GmailService, type GmailSQSMessageBody } from '../../lib/dataSources/gmail';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import { getDocumentSizeEstimate } from '../../lib/helper';
import { notifyImportsCompleted, refreshGoogleOAuthToken } from '../../lib/internalAPI';
import { MimeType } from '../../lib/dataSources/gmail/constants';
import { getEmailMetadata, sanitizePlainTextMessageToMessageChunks } from './utility';
import { BaseGmailMessageLink } from './constants';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

let storageUsageMapCache: { [dataSourceId: string]: number };

const processGmailMessageThread = async (
    mongo: MongoDBService,
    threadData: GetThreadResponse,
    messageBody: GmailSQSMessageBody,
): Promise<void> => {
    await Promise.all(
        threadData.messages.map(async (message) => {
            if (!message.payload.parts) {
                return;
            }

            const messageTextPart = message.payload.parts.find(
                (messagePart) => messagePart.mimeType === MimeType.TEXT || messagePart.mimeType === MimeType.MULTI,
            );

            if (!messageTextPart) {
                return;
            }

            const textChunks = sanitizePlainTextMessageToMessageChunks(messageTextPart.body.data);

            if (!textChunks.length) {
                return;
            }

            const emailMeta = getEmailMetadata(message);

            await Promise.all(
                textChunks.map(async (textChunk) => {
                    if (!textChunk.length) {
                        return;
                    }

                    const embedding = await gemini.getTextEmbedding(
                        `Email subject: ${emailMeta.subject}, to: ${emailMeta.receiver}, Excerpt: ${textChunk}`,
                    );
                    const annotationsResponse = await gemini.getTextAnnotation(textChunk, 0.41, 0.88);
                    const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

                    const [writeElementsSummary] = await Promise.all([
                        mongo.writeDataElements({
                            _id: message.id,
                            ownerEntityId: messageBody.ownerEntityId,
                            text: textChunk,
                            title: emailMeta.subject,
                            embedding,
                            createdAt: new Date().getTime(),
                            modifiedAt: emailMeta.date,
                            url: `${BaseGmailMessageLink}${message.id}`,
                            author:
                                emailMeta.senderName && emailMeta.senderEmail
                                    ? {
                                          name: emailMeta.senderName,
                                          email: emailMeta.senderEmail,
                                      }
                                    : undefined,
                            annotations,
                            dataSourceType: GmailService.DataSourceTypeName,
                            threadId: threadData.id,
                        }),
                        emailMeta.senderName && emailMeta.senderEmail
                            ? mongo.writeAuthors({
                                  name: emailMeta.senderName,
                                  email: emailMeta.senderEmail,
                                  entityId: messageBody.ownerEntityId,
                              })
                            : Promise.resolve(),
                        mongo.writeLabels(annotations, messageBody.ownerEntityId),
                    ]);

                    storageUsageMapCache[messageBody.dataSourceId] =
                        storageUsageMapCache[messageBody.dataSourceId] ??
                        0 + getDocumentSizeEstimate(writeElementsSummary.lengthDiff, writeElementsSummary.isNew);
                }),
            );
        }),
    );
};

/**
 * Lambda SQS handler
 */
export const handler: Handler = async (event: SQSEvent) => {
    const completedDataSources: string[] = [];
    const dataSourceIdToAccessTokenMap: { [id: string]: string } = {};

    const mongo = await getMongoClientFromCacheOrInitiateConnection(
        process.env.MONGO_CONN_STRING as string,
        process.env.MONGO_DB_NAME as string,
    );

    console.log(`Processing ${event.Records.length} messages`);

    if (!storageUsageMapCache) {
        console.log('Initializing storage map cache');
        storageUsageMapCache = {};
    }

    for (const record of event.Records) {
        const messageBody: GmailSQSMessageBody = JSON.parse(record.body);

        if (!dataSourceIdToAccessTokenMap[messageBody.dataSourceId]) {
            dataSourceIdToAccessTokenMap[messageBody.dataSourceId] = await refreshGoogleOAuthToken(
                messageBody.refreshToken,
            );
        }
    }

    await Promise.all(
        event.Records.map(async (record) => {
            const messageBody: GmailSQSMessageBody = JSON.parse(record.body);

            if (messageBody.isFinal) {
                completedDataSources.push(messageBody.dataSourceId);
            }

            const googleAPI = new GmailService(
                dataSourceIdToAccessTokenMap[messageBody.dataSourceId],
                messageBody.refreshToken,
            );
            const threadData = await googleAPI.getThread(messageBody.threadId);

            await processGmailMessageThread(mongo, threadData, messageBody);
        }),
    );

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);
        await notifyImportsCompleted(completedDataSources, storageUsageMapCache);
    }

    return { success: true };
};
