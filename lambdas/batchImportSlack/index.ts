import { QdrantWrapper, type QdrantPayload, QdrantDataSource } from '@joshuajohnsonjj38/qdrant';
import omit from 'lodash/omit';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { Handler } from 'aws-lambda';
import { SecretMananger } from '@joshuajohnsonjj38/secret-mananger';
import { PrismaClient } from '@joshuajohnsonjj38/prisma';
import { SimplifiedSlackUser, SlackWrapper } from '@joshuajohnsonjj38/slack';

const openAI = new OpenAIWrapper('TODO');
const qdrant = new QdrantWrapper('TODO', 1234, 'TODO');
const secretMananger = new SecretMananger('', '', '');
const prisma = new PrismaClient();

const getWorkspaceUserInfo = async (service: SlackWrapper): Promise<{ [id: string]: SimplifiedSlackUser }> => {
    const users: any[] = [];
    let isComplete = false;
    let nextCursor: string | null = null;

    while (!isComplete) {
        let resp;
        if (!nextCursor) {
            resp = await service.listUsers();
        } else {
            resp = await service.listUsers(nextCursor);
        }

        users.push(
            ...resp.members.map((member) => [
                member.id,
                {
                    id: member.id,
                    name: member.real_name,
                    email: member.profile.email,
                },
            ]),
        );

        nextCursor = resp.response_metadata.next_cursor;
        isComplete = !!resp.response_metadata.next_cursor;
    }

    return Object.fromEntries(users);
};

// TODO: handle deletion/archived
// TODO: handle table/columns
export const handler: Handler = async (event) => {
    const messageData = JSON.parse(event.body);
    const slackKey = secretMananger.decrypt(messageData.secret);
    const slackService = new SlackWrapper(slackKey);

    const users = await getWorkspaceUserInfo(slackService);

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
