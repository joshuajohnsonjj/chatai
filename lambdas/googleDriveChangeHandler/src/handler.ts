import type { APIGatewayEvent, Handler } from 'aws-lambda';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { DataSourceTypeName, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
    GoogleDriveService,
    type GoogleDriveChangeEvent,
    docWebUrl,
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

const handleFileRemoved = async (fileId: string): Promise<void> => {
    await Promise.all([dynamo.deleteItemById(fileId), qdrant.deleteVectorById(fileId)]);
};

/**
 * Lambda Webhhok event handler
 *
 * Receives HTTP events for google drive file changes
 */
export const handler: Handler = async (event: APIGatewayEvent) => {
    const messageData: GoogleDriveChangeEvent = JSON.parse(event.body as string);
    const ownerEntityId = event.headers['X-Goog-Channel-Token']?.split('entityId:')[1];

    if (!ownerEntityId) {
        console.error(`Missing owner entity id for drive ${messageData.driveId}`);
        return;
    }

    if (messageData.changeType !== 'file') {
        console.log('Skipping non file change');
        return;
    }

    if (messageData.removed) {
        console.log(`Erasing data for removed file ${messageData.fileId}`);
        handleFileRemoved(messageData.fileId);
        return;
    }

    const dataSourceType = await prisma.dataSourceType.findFirstOrThrow({
        where: { name: DataSourceTypeName.GOOGLE_DRIVE },
        select: { id: true },
    });
    const dataSource = await prisma.dataSource.findUniqueOrThrow({
        where: {
            ownerEntityId_dataSourceTypeId: { ownerEntityId, dataSourceTypeId: dataSourceType.id },
        },
        select: { secret: true, id: true },
    });

    console.log(`Upserting file ${messageData.fileId} data for data source ${dataSource.id}`);

    const googleKey = rsaService.decrypt(dataSource.secret);
    const googleAPI = new GoogleDriveService(googleKey);
    const fileContent = await googleAPI.getFileContent(messageData.fileId);

    const text = buildPayloadTextsFile(messageData.file.title, fileContent);
    const payload: QdrantPayload = {
        date: new Date(messageData.time).getTime(),
        dataSource: QdrantDataSource.GOOGLE_DRIVE,
        ownerId: ownerEntityId,
    };

    const embedding = await openAI.getTextEmbedding(text);
    await Promise.all([
        qdrant.upsert(messageData.fileId, embedding, payload),
        dynamo.putItem({
            id: messageData.fileId,
            ownerEntityId,
            text,
            createdAt: new Date().toISOString(),
            url: docWebUrl(messageData.fileId),
        }),
    ]);
};
