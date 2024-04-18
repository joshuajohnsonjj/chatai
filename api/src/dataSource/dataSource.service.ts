import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
    CreateDataSourceResponseDto,
    CreateDataSourceQueryDto,
    TestDataSourceResponseDto,
} from './dto/dataSource.dto';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { DataSourceTypeName, EntityType } from '@prisma/client';
import { NotionWrapper, getPageTitle } from '@joshuajohnsonjj38/notion';
import { SlackWrapper } from '@joshuajohnsonjj38/slack';
import * as moment from 'moment';
import { v4 } from 'uuid';
import {
    AccessDeniedError,
    BadCredentialsError,
    BadRequestError,
    InternalError,
    ResourceNotFoundError,
} from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { CognitoAttribute, OganizationUserRole, PrismaError } from 'src/types';
import { SQS } from 'aws-sdk';
import type { SendMessageBatchRequest, SendMessageBatchRequestEntryList } from 'aws-sdk/clients/sqs';

@Injectable()
export class DataSourceService {
    private readonly sqsClient = new SQS({
        apiVersion: '2012-11-05',
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET')!,
        region: this.configService.get<string>('AWS_REGION')!,
    });

    private readonly rsaService = new RsaCipher(__dirname + '/../../private.pem');

    constructor(
        private readonly prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async createDataSource(
        params: CreateDataSourceQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<CreateDataSourceResponseDto> {
        if (params.ownerEntityType === EntityType.ORGANIZATION) {
            this.checkIsOrganizationAdmin(
                params.ownerEntityId,
                user[CognitoAttribute.ORG],
                user[CognitoAttribute.ORG_USER_ROLE],
            );
        } else if (params.ownerEntityId !== user.idUser) {
            throw new BadRequestError('User id mismatch');
        }

        const { isValid, message } = await this.testDataSourceConnection(
            params.dataSourceTypeId,
            params.secret,
            params.externalId,
        );

        if (!isValid) {
            throw new BadCredentialsError(message);
        }

        try {
            const dataSource = await this.prisma.dataSource.create({
                data: {
                    dataSourceTypeId: params.dataSourceTypeId,
                    ownerEntityId: params.ownerEntityId,
                    ownerEntityType: params.ownerEntityType,
                    secret: params.secret,
                    isSyncing: false,
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
        } catch (e) {
            if (e.code === PrismaError.FAILED_UNIQUE_CONSTRAINT) {
                throw new BadRequestError('Data source already exists for entity');
            }
            throw new InternalError();
        }
    }

    async testDataSourceCredential(
        params: CreateDataSourceQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<TestDataSourceResponseDto> {
        if (params.ownerEntityType === EntityType.ORGANIZATION) {
            this.checkIsOrganizationAdmin(
                params.ownerEntityId,
                user[CognitoAttribute.ORG],
                user[CognitoAttribute.ORG_USER_ROLE],
            );
        } else if (params.ownerEntityId !== user.idUser) {
            throw new BadRequestError('User id mismatch');
        }

        return await this.testDataSourceConnection(params.dataSourceTypeId, params.secret, params.externalId);
    }

    async syncDataSource(dataSourceId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const dataSource = await tx.dataSource.findUnique({
                where: { id: dataSourceId },
                select: { isSyncing: true, ownerEntityId: true, secret: true, type: { select: { name: true } } },
            });

            if (!dataSource) {
                throw new ResourceNotFoundError(dataSourceId, 'DataSource');
            }

            if (dataSource.isSyncing) {
                throw new BadRequestError('Data source sync already in progress');
            }

            await tx.dataSource.update({
                where: { id: dataSourceId },
                data: { isSyncing: true, updatedAt: new Date() },
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
        });
    }

    private async initNotionSync(encryptedSecret: string, ownerEntityId: string, dataSourceId: string): Promise<void> {
        const decryptedSecret = this.rsaService.decrypt(encryptedSecret);
        const notionService = new NotionWrapper(decryptedSecret);
        const messageGroupId = v4();
        const messageBatchEntries: SendMessageBatchRequestEntryList = [];

        let isComplete = false;
        let nextCursor: string | null = null;
        while (!isComplete) {
            const resp = await notionService.listPages(nextCursor);
            resp.results.forEach((page) => {
                // FIXME: needs to check last sync time of data source
                if (moment().isAfter(moment(page.last_edited_time))) {
                    messageBatchEntries.push({
                        Id: page.id,
                        MessageBody: JSON.stringify({
                            pageId: page.id,
                            pageUrl: page.url,
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

        this.sendSqsMessageBatches(
            messageBatchEntries,
            this.configService.get<string>('SQS_NOTION_QUEUE_URL')!,
            dataSourceId,
        );
    }

    private async initSlackSync(encryptedSecret: string, ownerEntityId: string, dataSourceId: string): Promise<void> {
        const decryptedSecret = this.rsaService.decrypt(encryptedSecret);
        const slackService = new SlackWrapper(decryptedSecret);
        const messageGroupId = v4();
        const messageBatchEntries: SendMessageBatchRequestEntryList = [];

        let isComplete = false;
        let nextCursor: string | null = null;
        while (!isComplete) {
            const resp = await slackService.listConversations(nextCursor);
            // TODO: check last sync time of data source
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

        this.sendSqsMessageBatches(
            messageBatchEntries,
            this.configService.get<string>('SQS_SLACK_QUEUE_URL')!,
            dataSourceId,
        );
    }

    private sendSqsMessageBatches(
        messageBatchEntries: SendMessageBatchRequestEntryList,
        url: string,
        dataSourceId: string,
    ): void {
        const maxMessageBatchSize = 10;
        for (let i = 0; i < messageBatchEntries!.length; i += maxMessageBatchSize) {
            const sqsMessageBatchInput: SendMessageBatchRequest = {
                QueueUrl: url,
                Entries: messageBatchEntries.slice(i, i + maxMessageBatchSize),
            };
            this.sqsClient.sendMessageBatch(sqsMessageBatchInput);
        }

        this.sqsClient.sendMessageBatch({
            QueueUrl: url,
            Entries: [
                {
                    Id: v4(),
                    MessageBody: JSON.stringify({ isFinal: true, dataSourceId }),
                    MessageGroupId: messageBatchEntries[0].MessageGroupId,
                },
            ],
        });
    }

    private async testDataSourceConnection(
        dataSourceTypeId: string,
        secret: string,
        externalId?: string,
    ): Promise<{ isValid: boolean; message: string }> {
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
                    message:
                        validity.appId && validity.token
                            ? ''
                            : !validity.appId
                              ? 'Invalid app id'
                              : 'Invalid token or missing scopes',
                };
            }
            default:
                return { isValid: false, message: 'Invalid data source type' };
        }
    }

    private checkIsOrganizationAdmin(reqOrgId: string, userOrgId: string, role: OganizationUserRole): void {
        if (
            ![OganizationUserRole.ORG_ADMIN || OganizationUserRole.ORG_OWNER].includes(role) ||
            reqOrgId !== userOrgId
        ) {
            throw new AccessDeniedError();
        }
    }
}
