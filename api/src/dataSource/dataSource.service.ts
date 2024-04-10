import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
    CreateDataSourceResponseDto,
    CreateDataSourceQueryDto,
    TestDataSourceResponseDto,
} from './dto/dataSource.dto';
// import { decrypt } from 'src/services/secretMananger';
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

    constructor(private readonly prisma: PrismaService) {}

    async createDataSource(params: CreateDataSourceQueryDto): Promise<CreateDataSourceResponseDto> {
        const isValid = await this.testDataSourceConnection(params.dataSourceTypeId, params.secret);

        if (!isValid) {
            throw new BadCredentialsError();
        }

        const dataSource = await this.prisma.dataSource.create({
            data: {
                dataSourceTypeId: params.dataSourceTypeId,
                ownerEntityId: params.ownerEntityId,
                ownerEntityType: params.ownerEntityType,
                secret: params.secret,
                isSyncing: true,
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
        const isValid = await this.testDataSourceConnection(params.dataSourceTypeId, params.secret);
        return { isValid };
    }

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
                this.initSlackSync(dataSource.secret, dataSource.ownerEntityId);
                break;
            default:
                break;
        }
    }

    private async initNotionSync(secret: string, ownerEntityId: string, dataSourceId: string): Promise<void> {
        const decryptedSecret = secret; //decrypt(secret);
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
                            secret: secret,
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

    private async initSlackSync(secret: string, ownerEntityId: string): Promise<void> {
        const decryptedSecret = secret; //decrypt(secret);
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
                            secret: secret,
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

        this.sendSqsMessageBatches(messageBatchEntries, process.env.SQS_SLACK_QUEUE_URL as string, '');
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

    private async testDataSourceConnection(dataSourceTypeId: string, secret: string): Promise<boolean> {
        const decryptedSecret = secret; //decrypt(secret);
        const dataSourceType = await this.prisma.dataSourceType.findUnique({
            where: {
                id: dataSourceTypeId,
            },
            select: {
                name: true,
            },
        });

        switch (dataSourceType?.name) {
            case DataSourceTypeName.NOTION:
                return new NotionWrapper(decryptedSecret).testConnection();
            case DataSourceTypeName.SLACK:
                return new SlackWrapper(decryptedSecret).testConnection();
            default:
                return false;
        }
    }
}
