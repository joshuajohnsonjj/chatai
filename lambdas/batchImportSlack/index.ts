import { QdrantWrapper, type QdrantPayload, QdrantDataSource } from '@joshuajohnsonjj38/qdrant';
import omit from 'lodash/omit';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { Handler } from 'aws-lambda';
import { SecretMananger } from '@joshuajohnsonjj38/secret-mananger';
import { PrismaClient } from '@joshuajohnsonjj38/prisma';
import { SlackWrapper } from '@joshuajohnsonjj38/slack';

const openAI = new OpenAIWrapper('TODO');
const qdrant = new QdrantWrapper('TODO', 1234, 'TODO');
const secretMananger = new SecretMananger('', '', '');
const prisma = new PrismaClient();

// TODO: handle deletion/archived
// TODO: handle table/columns
export const handler: Handler = async (event) => {
    const messageData = JSON.parse(event.body);
    const slackKey = secretMananger.decrypt(messageData.secret);
    const notionService = new SlackWrapper(slackKey);
    



    if (messageData.isFinal) {
        await prisma.dataSource.update({
            where: {
                id: event.dataSourceId,
            },
            data: {
                lastSync: new Date(),
                isSyncing: false,
            },
        });
    }
};
