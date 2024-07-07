import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION!,
});

export const sendSqsMessage = async (messageBody: string, url: string): Promise<void> => {
    const messageCommand = new SendMessageCommand({
        QueueUrl: url,
        MessageBody: messageBody,
    });

    await sqsClient.send(messageCommand);
};
