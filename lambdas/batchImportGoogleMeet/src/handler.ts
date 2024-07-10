import type { Handler, SQSEvent } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { GoogleMeetService, type Transcript, type GoogleMeetSQSMessageBody } from '../../lib/dataSources/googleMeet';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import { getDocumentSizeEstimate } from '../../lib/helper';
import { notifyImportsCompleted, refreshGoogleOAuthToken } from '../../lib/internalAPI';
import moment from 'moment';
import { TranscriptState } from '../../lib/dataSources/googleMeet/constants';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

let storageUsageMapCache: { [dataSourceId: string]: number };

const processTranscript = async (
    mongo: MongoDBService,
    googleService: GoogleMeetService,
    messageData: GoogleMeetSQSMessageBody,
    transcript: Omit<Transcript, 'name'> & { id: string },
) => {
    let isComplete = false;
    let nextCursor: string | undefined;

    while (!isComplete) {
        const transcriptEntries = await googleService.listTranscriptEntries(
            messageData.conferenceId,
            transcript.id,
            nextCursor,
        );

        await Promise.all(
            transcriptEntries.transcriptEntries.map(async (entry) => {
                if (transcript.state !== TranscriptState.FILE_GENERATED) {
                    return;
                }

                // skip if this transcript already imported
                const existingTranscriptRecord = await mongo.elementCollConnection.findOne({
                    ownerEntityId: messageData.ownerEntityId,
                    transcriptId: transcript.id,
                });
                if (existingTranscriptRecord) {
                    return;
                }

                const [embedding, annotationsResponse] = await Promise.all([
                    gemini.getTextEmbedding(`Google meeting speaker excerpt: ${entry.text}`),
                    gemini.getTextAnnotation(entry.text, 0.41, 0.88),
                ]);
                const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

                const [{ lengthDiff }] = await Promise.all([
                    mongo.writeDataElements({
                        _id: `transcripts/${transcript.id}/entries/${entry.id}`,
                        ownerEntityId: messageData.ownerEntityId,
                        text: entry.text,
                        title: `Google Meet Conference - ${moment(entry.startTime).format('mm/dd/yyyy')}`,
                        embedding,
                        createdAt: new Date().getTime(),
                        modifiedAt: new Date(entry.startTime).getTime(),
                        url: `https://docs.google.com/document/d/${transcript.docsDestination.document}/view`,
                        annotations,
                        dataSourceType: GoogleMeetService.DataSourceTypeName,
                        transcriptId: transcript.id,
                    }),
                    mongo.writeLabels(annotations, messageData.ownerEntityId),
                ]);

                storageUsageMapCache[messageData.dataSourceId] =
                    storageUsageMapCache[messageData.dataSourceId] ?? 0 + getDocumentSizeEstimate(lengthDiff, true);
            }),
        );

        if (!isComplete) {
            isComplete = !transcriptEntries.nextPageToken;
            nextCursor = transcriptEntries.nextPageToken ?? null;
        }
    }
};

const processConference = async (
    mongo: MongoDBService,
    googleService: GoogleMeetService,
    messageData: GoogleMeetSQSMessageBody,
): Promise<void> => {
    console.log(`Processing meeting ${messageData.conferenceId}`);

    let isComplete = false;
    let nextCursor: string | undefined;
    let ndx = 0;

    while (!isComplete) {
        const transcriptsRes = await googleService.listTranscripts(messageData.conferenceId, nextCursor);

        console.log(`Retrieved meeting batch ${ndx++} of results for data source ${messageData.dataSourceId}`);

        await Promise.all(
            transcriptsRes.transcripts.map(async (transcript) => {
                return processTranscript(mongo, googleService, messageData, transcript);
            }),
        );

        if (!isComplete) {
            isComplete = !transcriptsRes.nextPageToken;
            nextCursor = transcriptsRes.nextPageToken ?? null;
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
        const messageBody: GoogleMeetSQSMessageBody = JSON.parse(record.body);

        if (!dataSourceIdToAccessTokenMap[messageBody.dataSourceId]) {
            dataSourceIdToAccessTokenMap[messageBody.dataSourceId] = await refreshGoogleOAuthToken(
                messageBody.refreshToken,
            );
        }
    }

    await Promise.all(
        event.Records.map(async (record) => {
            const messageBody: GoogleMeetSQSMessageBody = JSON.parse(record.body);

            if (messageBody.isFinal) {
                completedDataSources.push(messageBody.dataSourceId);
            }

            const googleService = new GoogleMeetService(
                dataSourceIdToAccessTokenMap[messageBody.dataSourceId],
                messageBody.refreshToken,
            );

            await processConference(mongo, googleService, messageBody);
        }),
    );

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);
        await notifyImportsCompleted(completedDataSources, storageUsageMapCache);
    }

    return { success: true };
};
