import type {
    SendMessageBatchCommandOutput,
    SendMessageBatchRequest,
    SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { SQSClient, SendMessageBatchCommand, SendMessageCommand } from '@aws-sdk/client-sqs';

const MAX_BATCH_SIZE = 10;

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION as string,
});

export const sendSqsMessageBatches = async (
    messageBatchEntries: SendMessageBatchRequestEntry[],
    url: string,
): Promise<void> => {
    const messagePromises: Promise<SendMessageBatchCommandOutput>[] = [];

    for (let i = 0; i < messageBatchEntries!.length; i += MAX_BATCH_SIZE) {
        const sqsMessageBatchInput: SendMessageBatchRequest = {
            QueueUrl: url,
            Entries: messageBatchEntries.slice(i, i + MAX_BATCH_SIZE),
        };

        console.log(`Sending message batch ${i}`);

        messagePromises.push(sqsClient.send(new SendMessageBatchCommand(sqsMessageBatchInput)));
    }

    await Promise.all(messagePromises);
};

export const sendSqsMessage = async (dataSourceIds: string[], url: string): Promise<void> => {
    const messageCommand = new SendMessageCommand({
        QueueUrl: url,
        MessageBody: JSON.stringify({ dataSourceIds }),
    });
    await sqsClient.send(messageCommand);
};