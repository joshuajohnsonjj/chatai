import type {
    SendMessageBatchCommandOutput,
    SendMessageBatchRequest,
    SendMessageBatchRequestEntry,
    SQSClient,
} from '@aws-sdk/client-sqs';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { v4 } from 'uuid';

const MAX_BATCH_SIZE = 10;

export const sendSqsMessageBatches = async (
    client: SQSClient,
    messageBatchEntries: SendMessageBatchRequestEntry[],
    url: string,
    dataSourceId: string,
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
                        MessageBody: JSON.stringify({ isFinal: true, dataSourceId }),
                        MessageGroupId: messageGrouoId,
                    },
                ],
            }),
        ),
    );

    await Promise.all(messagePromises);
};
