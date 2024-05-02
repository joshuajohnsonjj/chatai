import type { Handler, SQSEvent } from 'aws-lambda';
import { isValidMessageBody } from './utility';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import * as dotenv from 'dotenv';
import {
    type GoogleDriveSQSFinalBody,
    GoogleDriveService,
    buildPayloadTextsFile,
} from '@joshuajohnsonjj38/google-drive';
import { GeminiService } from '@joshuajohnsonjj38/openai';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { DataSourceTypeName } from '@prisma/client';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);
const openAI = new GeminiService(process.env.GEMINI_KEY as string);

// TODO: move this else where
// const createWebhookConnections = async (completedDataSources: GoogleDriveSQSFinalBody[]): Promise<void> => {
//     await Promise.all(
//         completedDataSources.map(async (source) => {
//             const googleKey = rsaService.decrypt(source.secret);
//             const googleAPI = new GoogleDriveService(googleKey);
//             const response = await googleAPI.initiateWebhookConnection(
//                 source.ownerEntityId,
//                 process.env.GOOGLE_WEBHOOK_HANDLER_ADDRESS as string,
//             );
//             await prisma.googleDriveWebhookConnection.create({
//                 data: {
//                     connectionId: response.id,
//                     resourceId: response.resourceId,
//                     dataSourceId: source.dataSourceId,
//                     creatorUserId: source.userId,
//                 },
//             });
//         }),
//     );
// };

const processFile = async (
    mongo: MongoDBService,
    googleAPI: GoogleDriveService,
    fileId: string,
    ownerEntityId: string,
    fileUrl: string,
    fileName: string,
    modifiedDate: string,
) => {
    const fileContent = await googleAPI.getFileContent(fileId);
    const text = buildPayloadTextsFile(fileName, fileContent);
    // const payload: QdrantPayload = {
    //     date: new Date(modifiedDate).getTime(),
    //     dataSource: QdrantDataSource.GOOGLE_DRIVE,
    //     ownerId: ownerEntityId,
    // };

    const embedding = await openAI.getTextEmbedding(text);
    const annotations = await openAI.getTextAnnotation(text);
    await mongo.writeDataElements([
        {
            _id: fileId,
            ownerEntityId,
            text,
            embedding,
            createdAt: new Date(modifiedDate).getTime(),
            url: fileUrl,
            // FIXME: get author
            // authorName?: string;
            // authorRef?: string;
            annotations: [...annotations.categories, ...annotations.entities],
            dataSourceType: DataSourceTypeName.GOOGLE_DRIVE,
        },
    ]);
    // await Promise.all([
    //     qdrant.upsert(fileId, embedding, payload),
    //     dynamo.putItem({
    //         id: fileId,
    //         ownerEntityId,
    //         text,
    //         createdAt: new Date().toISOString(),
    //         url: fileUrl,
    //     }),
    // ]);
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
            continue;
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
            ),
        );
    }

    await Promise.all(processingFilePromises);

    // if (completedDataSources.length) {
    //     console.log('Sync completed ofr data source records:', completedDataSources);

    //     await Promise.all([
    //         prisma.dataSource.updateMany({
    //             where: {
    //                 id: {
    //                     in: completedDataSources.map((message) => message.dataSourceId),
    //                 },
    //             },
    //             data: {
    //                 lastSync: new Date(),
    //                 isSyncing: false,
    //                 updatedAt: new Date(),
    //             },
    //         }),
    //         createWebhookConnections(completedDataSources),
    //     ]);
    // }
};
