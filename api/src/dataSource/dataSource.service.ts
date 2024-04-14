import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
    CreateDataSourceResponseDto,
    CreateDataSourceQueryDto,
    TestDataSourceResponseDto,
} from './dto/dataSource.dto';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { DataSourceTypeName } from '@prisma/client';
import { NotionWrapper, getPageTitle } from '@joshuajohnsonjj38/notion';
import { SlackWrapper } from '@joshuajohnsonjj38/slack';
import moment from 'moment';
import {
    SQSClient,
    SendMessageBatchCommand,
    SendMessageBatchCommandInput,
    SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { v4 } from 'uuid';
import { BadCredentialsError, ResourceNotFoundError } from 'src/exceptions';

@Injectable()
export class DataSourceService {
    private readonly sqsClient = new SQSClient({ region: process.env.AWS_REGION });

    private readonly rsaService = new RsaCipher('../../private.pem');

    constructor(private readonly prisma: PrismaService) {}

    async createDataSource(params: CreateDataSourceQueryDto): Promise<CreateDataSourceResponseDto> {
        const { isValid, message } = await this.testDataSourceConnection(params.dataSourceTypeId, params.secret, params.externalId);

        if (!isValid) {
            throw new BadCredentialsError(message);
        }

        const dataSource = await this.prisma.dataSource.create({
            data: {
                dataSourceTypeId: params.dataSourceTypeId,
                ownerEntityId: params.ownerEntityId,
                ownerEntityType: params.ownerEntityType,
                secret: params.secret,
                isSyncing: true,
                externalId: params.externalId,
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                lastSync: true,
                dataSourceTypeId: true,
                ownerEntityId: true,
            },
        });

        this.syncDataSource(dataSource.id);

        return dataSource;
    }

    async testDataSourceCredential(params: CreateDataSourceQueryDto): Promise<TestDataSourceResponseDto> {
        return await this.testDataSourceConnection(params.dataSourceTypeId, params.secret, params.externalId);
    }

    // TODO: locking db?
    async syncDataSource(dataSourceId: string): Promise<void> {
        const dataSource = await this.prisma.dataSource.findUnique({
            where: { id: dataSourceId },
            select: { ownerEntityId: true, secret: true, type: { select: { name: true } } },
        });

        if (!dataSource) {
            throw new ResourceNotFoundError(dataSourceId, 'DataSource');
        }

        await this.prisma.dataSource.update({
            where: { id: dataSourceId },
            data: { isSyncing: true },
        });

        switch (dataSource.type.name) {
            case DataSourceTypeName.NOTION:
                this.initNotionSync(dataSource.secret, dataSource.ownerEntityId, dataSourceId);
                break;
            case DataSourceTypeName.SLACK:
                this.initSlackSync(dataSource.secret, dataSource.ownerEntityId, dataSourceId);
                break;
            default:
                break;
        }
    }

    private async initNotionSync(encryptedSecret: string, ownerEntityId: string, dataSourceId: string): Promise<void> {
        const decryptedSecret = this.rsaService.decrypt(encryptedSecret);
        const notionService = new NotionWrapper(decryptedSecret);
        const messageGroupId = v4();
        const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

        let isComplete = false;
        let nextCursor: string | null = null;
        while (!isComplete) {
            const resp = await notionService.listPages(nextCursor);

            resp.results.forEach((page) => {
                if (moment().isAfter(moment(page.last_edited_time))) {
                    messageBatchEntries.push({
                        Id: page.id,
                        MessageBody: JSON.stringify({
                            pageId: page.id,
                            pageUrl: page.public_url,
                            ownerEntityId: ownerEntityId,
                            pageTitle: getPageTitle(page),
                            secret: encryptedSecret,
                            dataSourceId,
                        }),
                        MessageGroupId: messageGroupId,
                    });
                } else {
                    isComplete = true;
                }
            });

            if (!isComplete) {
                isComplete = !resp.has_more;
                nextCursor = resp.next_cursor;
            }
        }

        this.sendSqsMessageBatches(messageBatchEntries, process.env.SQS_NOTION_QUEUE_URL as string, dataSourceId);
    }

    private async initSlackSync(encryptedSecret: string, ownerEntityId: string, dataSourceId: string): Promise<void> {
        const decryptedSecret = this.rsaService.decrypt(encryptedSecret);
        const slackService = new SlackWrapper(decryptedSecret);
        const messageGroupId = v4();
        const messageBatchEntries: SendMessageBatchRequestEntry[] = [];

        let isComplete = false;
        let nextCursor: string | null = null;
        while (!isComplete) {
            const resp = await slackService.listConversations(nextCursor);

            resp.channels.forEach((channel) => {
                messageBatchEntries.push({
                    Id: channel.id,
                    MessageBody: JSON.stringify({
                        channelId: channel.id,
                        channelName: channel.name,
                        ownerEntityId: ownerEntityId,
                        secret: encryptedSecret,
                        dataSourceId,
                    }),
                    MessageGroupId: messageGroupId,
                });
            });

            if (!isComplete) {
                isComplete = !resp?.response_metadata?.next_cursor;
                nextCursor = resp?.response_metadata?.next_cursor;
            }
        }

        this.sendSqsMessageBatches(messageBatchEntries, process.env.SQS_SLACK_QUEUE_URL as string, dataSourceId);
    }

    private sendSqsMessageBatches(
        messageBatchEntries: SendMessageBatchRequestEntry[],
        url: string,
        dataSourceId: string,
    ): void {
        const maxMessageBatchSize = 10;
        for (let i = 0; i < messageBatchEntries!.length; i += maxMessageBatchSize) {
            const sqsMessageBatchInput: SendMessageBatchCommandInput = {
                QueueUrl: url,
                Entries: messageBatchEntries.slice(i, i + maxMessageBatchSize),
            };
            this.sqsClient.send(new SendMessageBatchCommand(sqsMessageBatchInput));
        }

        this.sqsClient.send(
            new SendMessageBatchCommand({
                QueueUrl: url,
                Entries: [
                    {
                        Id: v4(),
                        MessageBody: JSON.stringify({ isFinal: true, dataSourceId }),
                        MessageGroupId: messageBatchEntries[0].MessageGroupId,
                    },
                ],
            }),
        );
    }

    private async testDataSourceConnection(
        dataSourceTypeId: string,
        secret: string,
        externalId?: string,
    ): Promise<{ isValid: boolean; message: string; }> {
        const decryptedSecret = this.rsaService.decrypt(secret);
        const dataSourceType = await this.prisma.dataSourceType.findUnique({
            where: {
                id: dataSourceTypeId,
            },
            select: {
                name: true,
            },
        });

        switch (dataSourceType?.name) {
            case DataSourceTypeName.NOTION: {
                const validity = await new NotionWrapper(decryptedSecret).testConnection();
                return { isValid: validity, message: validity ? '' : 'Invalid token' };
            }
            case DataSourceTypeName.SLACK: {
                const validity = await new SlackWrapper(decryptedSecret).testConnection(externalId ?? '');
                return {
                    isValid: validity.appId && validity.token,
                    message: validity.appId && validity.token ? '' : (!validity.appId ? 'Invalid app id' : 'Invalid token or missing scopes'),
                };
            }
            default:
                return { isValid: false, message: 'Invalid data source id' };
        }
    }
}
