import type { Handler, SQSEvent } from 'aws-lambda';
import { isValidMessageBody } from './utility';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import * as dotenv from 'dotenv';
import {
    type GoogleDriveSQSFinalBody,
    GoogleDriveService,
    buildPayloadTextsFile,
} from '@joshuajohnsonjj38/google-drive';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { DataSourceTypeName } from '@prisma/client';

dotenv.config({ path: __dirname + '/../../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);
const gemini = new GeminiService(process.env.GEMINI_KEY as string);

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
    const fileContent = await googleAPI.getFileContent(fileId);
    const textChunks = buildPayloadTextsFile(fileContent);

    // wipe any previous entries for this page
    // await mongo.elementCollConnection.deleteMany({
    //     fileId,
    //     ownerEntityId,
    // });

    let ndx = 0;

    await Promise.all(
        textChunks.map(async (chunk) => {
            const embedding = await gemini.getTextEmbedding(chunk);
            const annotations = await gemini.getTextAnnotation(chunk);

            console.log({
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
                annotations: [...annotations.categories, ...annotations.entities],
                dataSourceType: DataSourceTypeName.GOOGLE_DRIVE,
                fileId,
                filePartIndex: ndx,
            });

            ndx += 1;

            // await mongo.writeDataElements({
            //     _id: fileId,
            //     ownerEntityId,
            //     text,
            //     title: fileName,
            //     embedding,
            //     createdAt: new Date(modifiedDate).getTime(),
            //     url: fileUrl,
            //     author: authorName && authorEmail ? {
            //         name: authorName,
            //         email: authorEmail,
            //     } : undefined,
            //     annotations: [...annotations.categories, ...annotations.entities],
            //     dataSourceType: DataSourceTypeName.GOOGLE_DRIVE,
            // });
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

    const mongo = new MongoDBService(process.env.MONGO_CONN_STRING as string, process.env.MONGO_DB_NAME as string);
    await mongo.init();

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

        const googleKey = rsaService.decrypt(messageBody.secret);
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
