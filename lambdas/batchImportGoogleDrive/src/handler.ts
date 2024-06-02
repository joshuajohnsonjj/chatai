import type { Handler, SQSEvent } from 'aws-lambda';
import { InternalAPIEndpoints } from '../../lib/constants';
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
import axios from 'axios';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

let storageUsageMapCache: { [dataSourceId: string]: number };

const processFile = async (mongo: MongoDBService, googleAPI: GoogleDriveService, data: GoogleDriveSQSMessageBody) => {
    console.log(`Processing file ${data.fileId}, ${data.fileName}`);

    let textChunks: string[];

    try {
        const fileContent = await googleAPI.getFileContent(data.fileId);
        textChunks = buildPayloadTextsFile(fileContent);
    } catch (_e) {
        console.warn(`Could not get content from file ${data.fileId}, skipping...`);
        return;
    }

    // wipe any previous entries for this page
    await mongo.elementCollConnection.deleteMany({
        fileId: data.fileId,
        ownerEntityId: data.ownerEntityId,
    });

    let ndx = 0;

    await Promise.all(
        textChunks.map(async (chunk: string) => {
            const embedding = await gemini.getTextEmbedding(chunk);
            const annotationsResponse = await gemini.getTextAnnotation(chunk, 0.41, 0.88);
            const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

            await Promise.all([
                data.authorName && data.authorEmail
                    ? mongo.writeAuthors({
                          name: data.authorName,
                          email: data.authorEmail,
                          entityId: data.ownerEntityId,
                      })
                    : Promise.resolve(),
                mongo.writeLabels(annotations, data.ownerEntityId),
                mongo.writeDataElements({
                    _id: `${data.fileId}-${ndx}`,
                    ownerEntityId: data.ownerEntityId,
                    text: chunk,
                    title: data.fileName,
                    embedding,
                    createdAt: new Date(data.modifiedDate).getTime(),
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
            ]);

            storageUsageMapCache[data.dataSourceId] =
                storageUsageMapCache[data.dataSourceId] ?? 0 + getDocumentSizeEstimate(chunk.length);

            ndx += 1;
        }),
    );
};

/**
 * Lambda SQS handler
 */
export const handler: Handler = async (event: SQSEvent) => {
    // TODO: error handling, dead letter queue?
    const processingFilePromises: Promise<void>[] = [];
    const completedDataSources: GoogleDriveSQSMessageBody[] = [];

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

        if (messageBody.isFinal) {
            completedDataSources.push(messageBody);
        }

        const googleAPI = new GoogleDriveService(messageBody.secret);

        processingFilePromises.push(processFile(mongo, googleAPI, messageBody));
    }

    await Promise.all(processingFilePromises);

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);

        await axios({
            method: 'patch',
            baseURL: process.env.INTERNAL_BASE_API_HOST!,
            url: InternalAPIEndpoints.COMPLETED_IMPORTS,
            data: {
                completed: completedDataSources.map((message) => ({
                    dataSourceId: message.dataSourceId,
                    bytesDelta: storageUsageMapCache[message.dataSourceId] ?? 0,
                    userId: message.userId,
                })),
            },
            headers: {
                'api-key': process.env.INTERNAL_API_KEY!,
            },
        });
    }

    return { success: true };
};
