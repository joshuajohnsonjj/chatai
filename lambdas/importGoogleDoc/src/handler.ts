import type { Handler, SQSEvent } from 'aws-lambda';
import { isValidMessageBody } from './utility';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
    type GoogleDriveSQSFinalBody,
    GoogleDriveService,
    buildPayloadTextsFile,
} from '@joshuajohnsonjj38/google-drive';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantDataSource, QdrantWrapper, type QdrantPayload } from '@joshuajohnsonjj38/qdrant';
import { DynamoClient } from '@joshuajohnsonjj38/dynamo';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);
const prisma = new PrismaClient();
const openAI = new OpenAIWrapper(process.env.GEMINI_KEY as string);
const qdrant = new QdrantWrapper(
    process.env.QDRANT_HOST as string,
    process.env.QDRANT_COLLECTION as string,
    process.env.QDRANT_KEY as string,
);
const dynamo = new DynamoClient(process.env.AWS_REGION as string);

const createWebhookConnections = async (completedDataSources: GoogleDriveSQSFinalBody[]): Promise<void> => {
    await Promise.all(
        completedDataSources.map(async (source) => {
            const googleKey = rsaService.decrypt(source.secret);
            const googleAPI = new GoogleDriveService(googleKey);
            const response = await googleAPI.initiateWebhookConnection(
                source.ownerEntityId,
                process.env.GOOGLE_WEBHOOK_HANDLER_ADDRESS as string,
            );
            await prisma.googleDriveWebhookConnection.create({
                data: {
                    connectionId: response.id,
                    resourceId: response.resourceId,
                    dataSourceId: source.dataSourceId,
                },
            });
        }),
    );
};

const processFile = async (
    googleAPI: GoogleDriveService,
    fileId: string,
    ownerEntityId: string,
    fileUrl: string,
    fileName: string,
    modifiedDate: string,
) => {
    const fileContent = await googleAPI.getFileContent(fileId);
    const text = buildPayloadTextsFile(fileName, fileContent);
    const payload: QdrantPayload = {
        // TODO: publish qdrant update to npm, update imports
        date: new Date(modifiedDate).getTime(),
        dataSource: QdrantDataSource.GOOGLE_DRIVE,
        ownerId: ownerEntityId,
    };

    const embedding = await openAI.getTextEmbedding(text);
    await Promise.all([
        qdrant.upsert(fileId, embedding, payload),
        dynamo.putItem({
            id: fileId,
            ownerEntityId,
            text,
            createdAt: new Date().toISOString(),
            url: fileUrl,
        }),
    ]);
};

/**
 * Lambda SQS handler
 */
export const handler: Handler = async (event: SQSEvent) => {
    // TODO: error handling, dead letter queue?
    const processingFilePromises: Promise<void>[] = [];
    const completedDataSources: GoogleDriveSQSFinalBody[] = [];

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

    if (completedDataSources.length) {
        console.log('Sync completed ofr data source records:', completedDataSources);

        await Promise.all([
            prisma.dataSource.updateMany({
                where: {
                    id: {
                        in: completedDataSources.map((message) => message.dataSourceId),
                    },
                },
                data: {
                    lastSync: new Date(),
                    isSyncing: false,
                    updatedAt: new Date(),
                },
            }),
            createWebhookConnections(completedDataSources),
        ]);
    }
};
// TODO: publish google drive types update to npm, update imports
