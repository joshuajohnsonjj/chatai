import type { Handler, SQSEvent } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { GoogleCalService, type GoogleCalSQSMessageBody } from '../../lib/dataSources/googleCal';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import { getDocumentSizeEstimate } from '../../lib/helper';
import { notifyImportsCompleted, refreshGoogleOAuthToken } from '../../lib/internalAPI';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

let storageUsageMapCache: { [dataSourceId: string]: number };

const processCalendar = async (
    mongo: MongoDBService,
    googleService: GoogleCalService,
    messageData: GoogleCalSQSMessageBody,
): Promise<void> => {
    console.log(`Processing file ${messageData.calId}`);

    let isComplete = false;
    let nextCursor: string | undefined;
    let ndx = 0;

    while (!isComplete) {
        const eventsRes = await googleService.getCalEvents(
            messageData.calId,
            messageData.lowerDateBound,
            nextCursor,
            2000,
        );

        console.log(`Retrieved events batch ${ndx++} of results for data source ${messageData.dataSourceId}`);

        await Promise.all(
            eventsRes.items.map(async (event) => {
                const text = googleService.buildTextBodyFromEvent(
                    eventsRes.summary,
                    eventsRes.description,
                    event.creator,
                    event.attendees,
                    event.location,
                    event.start,
                    event.end,
                );
                const [embedding, annotationsResponse] = await Promise.all([
                    gemini.getTextEmbedding(text),
                    gemini.getTextAnnotation(text, 0.41, 0.88),
                ]);
                const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

                const [writeElementsSummary] = await Promise.all([
                    mongo.writeDataElements({
                        _id: `${event.id}`,
                        ownerEntityId: messageData.ownerEntityId,
                        text,
                        title: eventsRes.summary,
                        embedding,
                        createdAt: new Date().getTime(),
                        modifiedAt: new Date(event.updated).getTime(),
                        url: event.htmlLink,
                        author:
                            event.creator.displayName && event.creator.email
                                ? {
                                      name: event.creator.displayName,
                                      email: event.creator.email,
                                  }
                                : undefined,
                        annotations,
                        dataSourceType: GoogleCalService.DataSourceTypeName,
                    }),
                    event.creator.displayName && event.creator.email
                        ? mongo.writeAuthors({
                              name: event.creator.displayName,
                              email: event.creator.email,
                              entityId: messageData.ownerEntityId,
                          })
                        : Promise.resolve(),
                    mongo.writeLabels(annotations, messageData.ownerEntityId),
                ]);

                storageUsageMapCache[messageData.dataSourceId] =
                    storageUsageMapCache[messageData.dataSourceId] ??
                    0 + getDocumentSizeEstimate(writeElementsSummary.lengthDiff, writeElementsSummary.isNew);

                ndx += 1;
            }),
        );

        if (!isComplete) {
            isComplete = !eventsRes.nextPageToken;
            nextCursor = eventsRes.nextPageToken ?? null;
        }
    }
};

/**
 * Lambda SQS handler
 */
export const handler: Handler = async (event: SQSEvent) => {
    const completedDataSources: string[] = [];
    const dataSourceIdToAccessTokenMap: { [id: string]: string } = {};

    const mongo = await getMongoClientFromCacheOrInitiateConnection(
        process.env.MONGO_CONN_STRING!,
        process.env.MONGO_DB_NAME!,
    );

    console.log(`Processing ${event.Records.length} messages`);

    if (!storageUsageMapCache) {
        console.log('Initializing storage map cache');
        storageUsageMapCache = {};
    }

    for (const record of event.Records) {
        const messageBody: GoogleCalSQSMessageBody = JSON.parse(record.body);

        if (!dataSourceIdToAccessTokenMap[messageBody.dataSourceId]) {
            dataSourceIdToAccessTokenMap[messageBody.dataSourceId] = await refreshGoogleOAuthToken(
                messageBody.refreshToken,
            );
        }
    }

    await Promise.all(
        event.Records.map(async (record) => {
            const messageBody: GoogleCalSQSMessageBody = JSON.parse(record.body);

            if (messageBody.isFinal) {
                completedDataSources.push(messageBody.dataSourceId);
            }

            const googleService = new GoogleCalService(
                dataSourceIdToAccessTokenMap[messageBody.dataSourceId],
                messageBody.refreshToken,
            );

            await processCalendar(mongo, googleService, messageBody);
        }),
    );

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);
        await notifyImportsCompleted(completedDataSources, storageUsageMapCache);
    }

    return { success: true };
};
