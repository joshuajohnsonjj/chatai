import type {
    SendMessageBatchCommandOutput,
    SendMessageBatchRequest,
    SendMessageBatchRequestEntry,
    SQSClient,
} from '@aws-sdk/client-sqs';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import type { GoogleDriveSQSFinalBody } from '@joshuajohnsonjj38/google-drive';
import { DataSourceTypeName } from '@prisma/client';
import { v4 } from 'uuid';

const MAX_BATCH_SIZE = 10;

const createFinalMessageBody = (
    dataSourceType: DataSourceTypeName,
    dataSourceId: string,
    entry: SendMessageBatchRequestEntry,
    shouldInitiateWebhook: boolean,
    initiatingUserId?: string,
): string => {
    if (dataSourceType !== DataSourceTypeName.GOOGLE_DRIVE) {
        return JSON.stringify({ isFinal: true, dataSourceId });
    } else {
        const body = JSON.parse(entry.MessageBody!);
        return JSON.stringify({
            isFinal: true,
            dataSourceId,
            secret: body.secret,
            ownerEntityId: body.ownerEntityId,
            shouldInitiateWebhook,
            userId: initiatingUserId,
        } as GoogleDriveSQSFinalBody);
    }
};

export const sendSqsMessageBatches = async (
    client: SQSClient,
    messageBatchEntries: SendMessageBatchRequestEntry[],
    url: string,
    dataSourceId: string,
    dataSourceType: DataSourceTypeName,
    shouldInitiateWebhook = false,
    initiatingUserId?: string,
): Promise<void> => {
    const messageGrouoId = messageBatchEntries[0].MessageGroupId;
    const messagePromises: Promise<SendMessageBatchCommandOutput>[] = [];

    for (let i = 0; i < messageBatchEntries!.length; i += MAX_BATCH_SIZE) {
        const sqsMessageBatchInput: SendMessageBatchRequest = {
            QueueUrl: url,
            Entries: messageBatchEntries.slice(i, i + MAX_BATCH_SIZE),
        };

        messagePromises.push(client.send(new SendMessageBatchCommand(sqsMessageBatchInput)));
    }

    messagePromises.push(
        client.send(
            new SendMessageBatchCommand({
                QueueUrl: url,
                Entries: [
                    {
                        Id: v4(),
                        MessageBody: createFinalMessageBody(
                            dataSourceType,
                            dataSourceId,
                            messageBatchEntries[0],
                            shouldInitiateWebhook,
                            initiatingUserId,
                        ),
                        MessageGroupId: messageGrouoId,
                    },
                ],
            }),
        ),
    );

    await Promise.all(messagePromises);
};
