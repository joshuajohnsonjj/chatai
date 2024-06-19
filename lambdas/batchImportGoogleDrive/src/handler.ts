import type { Handler, SQSEvent } from 'aws-lambda';
import * as dotenv from 'dotenv';
import {
    GoogleDriveService,
    buildPayloadTextsFile,
    type GoogleDriveSQSMessageBody,
} from '../../lib/dataSources/googleDrive';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import { getDocumentSizeEstimate } from '../../lib/helper';
import { notifyImportsCompleted, refreshGoogleOAuthToken } from '../../lib/internalAPI';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

let storageUsageMapCache: { [dataSourceId: string]: number };

/**
 * wipe any previous entries that existed for this page which were not
 * overwritten by the documents that were just inserted. first retrieves
 * them to get text len to update storage map cache
 */
const wipeStaleDataElementDocuments = async (
    mongo: MongoDBService,
    fileId: string,
    ownerEntityId: string,
    dataSourceId: string,
): Promise<void> => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).getTime();
    const queryCursor = mongo.elementCollConnection.find({
        fileId,
        ownerEntityId,
        createdAt: { $lte: fiveMinsAgo },
    });

    const staleElements = await queryCursor.toArray();

    const deletedBytes = staleElements.reduce(
        (prev, curr) => prev + getDocumentSizeEstimate(curr.text.length, true),
        0,
    );
    storageUsageMapCache[dataSourceId] = storageUsageMapCache[dataSourceId] ?? 0 - deletedBytes;

    await mongo.elementCollConnection.deleteMany({
        _id: { $in: staleElements.map((el) => el._id) },
    });
};

const processFile = async (
    mongo: MongoDBService,
    googleAPI: GoogleDriveService,
    data: GoogleDriveSQSMessageBody,
): Promise<void> => {
    console.log(`Processing file ${data.fileId}, ${data.fileName}`);

    let textChunks: string[];

    try {
        const fileContent = await googleAPI.getFileContent(data.fileId);
        textChunks = buildPayloadTextsFile(fileContent);
    } catch (_e) {
        console.warn(`Could not get content from file ${data.fileId}, skipping...`);
        return;
    }

    let ndx = 0;
    await Promise.all(
        textChunks.map(async (chunk: string) => {
            const embedding = await gemini.getTextEmbedding(chunk);
            const annotationsResponse = await gemini.getTextAnnotation(chunk, 0.41, 0.88);
            const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

            const [writeElementsSummary] = await Promise.all([
                mongo.writeDataElements({
                    _id: `${data.fileId}-${ndx}`,
                    ownerEntityId: data.ownerEntityId,
                    text: chunk,
                    title: data.fileName,
                    embedding,
                    createdAt: new Date(data.modifiedDate).getTime(),
                    modifiedAt: new Date(data.modifiedDate).getTime(),
                    url: data.fileUrl,
                    author:
                        data.authorName && data.authorEmail
                            ? {
                                  name: data.authorName,
                                  email: data.authorEmail,
                              }
                            : undefined,
                    annotations,
                    dataSourceType: 'GOOGLE_DRIVE',
                    fileId: data.fileId,
                    filePartIndex: ndx,
                }),
                data.authorName && data.authorEmail
                    ? mongo.writeAuthors({
                          name: data.authorName,
                          email: data.authorEmail,
                          entityId: data.ownerEntityId,
                      })
                    : Promise.resolve(),
                mongo.writeLabels(annotations, data.ownerEntityId),
            ]);

            storageUsageMapCache[data.dataSourceId] =
                storageUsageMapCache[data.dataSourceId] ??
                0 + getDocumentSizeEstimate(writeElementsSummary.lengthDiff, writeElementsSummary.isNew);

            ndx += 1;
        }),
    );

    await wipeStaleDataElementDocuments(mongo, data.fileId, data.ownerEntityId, data.dataSourceId);
};

/**
 * Lambda SQS handler
 */
export const handler: Handler = async (event: SQSEvent) => {
    // TODO: error handling, dead letter queue?
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
        const messageBody: GoogleDriveSQSMessageBody = JSON.parse(record.body);

        if (!dataSourceIdToAccessTokenMap[messageBody.dataSourceId]) {
            dataSourceIdToAccessTokenMap[messageBody.dataSourceId] = await refreshGoogleOAuthToken(
                messageBody.refreshToken,
            );
        }
    }

    await Promise.all(
        event.Records.map(async (record) => {
            const messageBody: GoogleDriveSQSMessageBody = JSON.parse(record.body);

            if (messageBody.isFinal) {
                completedDataSources.push(messageBody.dataSourceId);
            }

            const googleAPI = new GoogleDriveService(
                dataSourceIdToAccessTokenMap[messageBody.dataSourceId],
                messageBody.refreshToken,
            );

            await processFile(mongo, googleAPI, messageBody);
        }),
    );

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);
        await notifyImportsCompleted(completedDataSources, storageUsageMapCache);
    }

    return { success: true };
};
