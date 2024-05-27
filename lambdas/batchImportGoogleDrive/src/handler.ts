import type { Handler, SQSEvent } from 'aws-lambda';
import { isValidMessageBody } from './utility';
import { decryptData } from '../../lib/descryption';
import * as dotenv from 'dotenv';
import {
    type GoogleDriveSQSFinalBody,
    GoogleDriveService,
    buildPayloadTextsFile,
} from '../../lib/dataSources/googleDrive';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';

dotenv.config({ path: __dirname + '/../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY!);

const processFile = async (
    mongo: MongoDBService,
    googleAPI: GoogleDriveService,
    fileId: string,
    ownerEntityId: string,
    fileUrl: string,
    fileName: string,
    modifiedDate: string,
    authorName?: string,
    authorEmail?: string,
) => {
    console.log(`Processing file ${fileId}, ${fileName}`);

    let textChunks: string[];

    try {
        const fileContent = await googleAPI.getFileContent(fileId);
        textChunks = buildPayloadTextsFile(fileContent);
    } catch (_e) {
        console.warn(`Could not get content from file ${fileId}, skipping...`);
        return;
    }

    // wipe any previous entries for this page
    await mongo.elementCollConnection.deleteMany({
        fileId,
        ownerEntityId,
    });

    let ndx = 0;

    await Promise.all(
        textChunks.map(async (chunk: string) => {
            const embedding = await gemini.getTextEmbedding(chunk);
            const annotationsResponse = await gemini.getTextAnnotation(chunk, 0.41, 0.88);
            const annotations = [...annotationsResponse.categories, ...annotationsResponse.entities];

            await Promise.all([
                authorName && authorEmail
                    ? mongo.writeAuthors({
                          name: authorName!,
                          email: authorEmail!,
                          entityId: ownerEntityId,
                      })
                    : Promise.resolve(),
                mongo.writeLabels(annotations, ownerEntityId),
                mongo.writeDataElements({
                    _id: `${fileId}-${ndx}`,
                    ownerEntityId,
                    text: chunk,
                    title: fileName,
                    embedding,
                    createdAt: new Date(modifiedDate).getTime(),
                    url: fileUrl,
                    author:
                        authorName && authorEmail
                            ? {
                                  name: authorName,
                                  email: authorEmail,
                              }
                            : undefined,
                    annotations,
                    dataSourceType: 'GOOGLE_DRIVE',
                    fileId,
                    filePartIndex: ndx,
                }),
            ]);

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
    const completedDataSources: GoogleDriveSQSFinalBody[] = [];

    const mongo = await getMongoClientFromCacheOrInitiateConnection(
        process.env.MONGO_CONN_STRING as string,
        process.env.MONGO_DB_NAME as string,
    );

    console.log(`Processing ${event.Records.length} messages`);

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        if (!isValidMessageBody(messageBody)) {
            console.error('Skipping invalid message', messageBody);
            continue;
        }

        if (messageBody.isFinal) {
            completedDataSources.push(messageBody);
        }

        const googleKey = decryptData(process.env.RSA_PRIVATE_KEY!, messageBody.secret);
        const googleAPI = new GoogleDriveService(googleKey);

        processingFilePromises.push(
            processFile(
                mongo,
                googleAPI,
                messageBody.fileId,
                messageBody.ownerEntityId,
                messageBody.fileUrl,
                messageBody.fileName,
                messageBody.modifiedDate,
                messageBody.authorName,
                messageBody.authorEmail,
            ),
        );
    }

    await Promise.all(processingFilePromises);

    // TODO: complete sources req
};
