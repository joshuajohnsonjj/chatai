import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
    CreateDataSourceResponseDto,
    CreateDataSourceQueryDto,
    TestDataSourceResponseDto,
    ListDataSourceConnectionsResponseDto,
    ListDataSourceTypesResponseDto,
} from './dto/dataSource.dto';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { DataSourceTypeName, EntityType, UserType } from '@prisma/client';
import { NotionWrapper } from '@joshuajohnsonjj38/notion';
import { SlackWrapper } from '@joshuajohnsonjj38/slack';
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
import { omit, snakeCase } from 'lodash';
import { GoogleDriveService } from '@joshuajohnsonjj38/google-drive';
import axios from 'axios';

@Injectable()
export class DataSourceService {
    private readonly rsaService = new RsaCipher(this.configService.get<string>('RSA_PRIVATE_KEY')!);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}

    async createDataSource(
        params: CreateDataSourceQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<CreateDataSourceResponseDto> {
        this.logger.log('Creating new data source', 'DataSource');

        if (params.userType === UserType.ORGANIZATION_MEMBER) {
            this.checkIsOrganizationAdmin(params.ownerEntityId, user.organization, user.oganizationUserRole);
        } else if (params.ownerEntityId !== user.idUser) {
            throw new AccessDeniedError('User id mismatch');
        }

        const dataSourceType = await this.prisma.dataSourceType.findUniqueOrThrow({
            where: {
                id: params.dataSourceTypeId,
            },
            select: {
                name: true,
                requiredCredentialTypes: true,
            },
        });

        this.verifyRequiredCredentialTypesProvided(dataSourceType.requiredCredentialTypes, params);

        const { isValid, message } = await this.testDataSourceConnection(
            dataSourceType.name,
            params.secret,
            params.externalId,
        );

        if (!isValid) {
            this.logger.error('Invalid data source credential', 'DataSource');
            throw new BadCredentialsError(message);
        }

        try {
            const dataSource = await this.prisma.dataSource.create({
                data: {
                    dataSourceTypeId: params.dataSourceTypeId,
                    ownerEntityId: params.ownerEntityId,
                    ownerEntityType:
                        params.userType === UserType.ORGANIZATION_MEMBER
                            ? EntityType.ORGANIZATION
                            : EntityType.INDIVIDUAL,
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

            this.syncDataSource(dataSource.id, user);

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
        this.logger.log('Testing data source credential', 'DataSource');

        if (params.userType === UserType.ORGANIZATION_MEMBER) {
            this.checkIsOrganizationAdmin(params.ownerEntityId, user.organization, user.oganizationUserRole);
        } else if (params.ownerEntityId !== user.idUser) {
            throw new AccessDeniedError('User id mismatch');
        }

        const dataSourceType = await this.prisma.dataSourceType.findUniqueOrThrow({
            where: {
                id: params.dataSourceTypeId,
            },
            select: {
                name: true,
            },
        });

        return await this.testDataSourceConnection(dataSourceType.name, params.secret, params.externalId);
    }

    async killGoogleDriveWebhookConnection(dataSourceId: string, userId: string): Promise<void> {
        this.logger.log(`Destroying google drive webhook connection for ${dataSourceId}`, 'DataSource');

        const dataSource = await this.prisma.dataSource.findUnique({
            where: { id: dataSourceId },
            select: {
                ownerEntityId: true,
                secret: true,
                googleDriveConnection: {
                    select: {
                        id: true,
                        connectionId: true,
                        resourceId: true,
                        creatorUserId: true,
                    },
                },
            },
        });

        if (!dataSource) {
            throw new ResourceNotFoundError(dataSourceId, 'DataSource');
        }

        if (!dataSource.googleDriveConnection) {
            throw new BadRequestError('No open google drive webhook connection for this data source');
        }

        if (dataSource.googleDriveConnection.creatorUserId !== userId) {
            throw new BadRequestError('Only the original creator of the webhook connection may delete it.');
        }

        const decryptedSecret = this.rsaService.decrypt(dataSource.secret);

        await new GoogleDriveService(decryptedSecret).killWebhookConnection(
            dataSource.googleDriveConnection.connectionId,
            dataSource.googleDriveConnection.resourceId,
        );
        await this.prisma.googleDriveWebhookConnection.delete({
            where: { id: dataSource.googleDriveConnection.id },
        });
    }

    async createGoogleDriveWebhookConnection(dataSourceId: string, userId: string): Promise<void> {
        this.logger.log(`Creating google drive webhook connection for ${dataSourceId}`, 'DataSource');

        const dataSource = await this.prisma.dataSource.findUnique({
            where: { id: dataSourceId },
            select: {
                ownerEntityId: true,
                secret: true,
                googleDriveConnection: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!dataSource) {
            throw new ResourceNotFoundError(dataSourceId, 'DataSource');
        }

        if (dataSource.googleDriveConnection) {
            throw new BadRequestError('Connection already exists');
        }

        const decryptedSecret = this.rsaService.decrypt(dataSource.secret);
        const googleAPI = new GoogleDriveService(decryptedSecret);
        const response = await googleAPI.initiateWebhookConnection(
            dataSource.ownerEntityId,
            this.configService.get<string>('GOOGLE_WEBHOOK_HANDLER_ADDRESS')!,
        );
        await this.prisma.googleDriveWebhookConnection.create({
            data: {
                connectionId: response.id,
                resourceId: response.resourceId,
                dataSourceId: dataSourceId,
                creatorUserId: userId,
            },
        });
    }

    async listDataSourceTypes(): Promise<ListDataSourceTypesResponseDto[]> {
        const queryRes = await this.prisma.dataSourceType.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                isLiveSyncAvailable: true,
            },
        });

        return queryRes;
    }

    async listUserDataSourceConnections(user: DecodedUserTokenDto): Promise<ListDataSourceConnectionsResponseDto[]> {
        const entityId = user[CognitoAttribute.ORG_USER_ROLE] ?? user.idUser;

        const queryRes = await this.prisma.dataSource.findMany({
            where: {
                ownerEntityId: entityId,
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                lastSync: true,
                dataSourceTypeId: true,
                ownerEntityId: true,
                ownerEntityType: true,
                externalId: true,
                isSyncing: true,
                type: {
                    select: {
                        name: true,
                        isLiveSyncAvailable: true,
                    },
                },
            },
        });

        return queryRes.map((item) => ({
            ...omit(item, ['externalId', 'type']),
            hasExternalId: !!item.externalId,
            dataSourceName: item.type.name,
            dataSourceLiveSyncAvailable: item.type.isLiveSyncAvailable,
        }));
    }

    async syncDataSource(dataSourceId: string, user: DecodedUserTokenDto): Promise<void> {
        this.logger.log(`Starting data source sync for data source: ${dataSourceId}`, 'DataSource');

        await this.prisma.$transaction(async (tx) => {
            const dataSource = await tx.dataSource.findUnique({
                where: { id: dataSourceId },
                select: {
                    isSyncing: true,
                    ownerEntityId: true,
                    secret: true,
                    lastSync: true,
                    type: { select: { name: true } },
                },
            });

            if (!dataSource) {
                this.logger.error(`Data source ${dataSourceId} not found`, 'DataSource');
                throw new ResourceNotFoundError(dataSourceId, 'DataSource');
            }

            if (dataSource.ownerEntityId !== user.idUser && dataSource.ownerEntityId !== user[CognitoAttribute.ORG]) {
                throw new AccessDeniedError('User not associated with this data source');
            }

            if (dataSource.isSyncing) {
                this.logger.error(`Data source ${dataSourceId} already syncing`, 'DataSource');
                throw new BadRequestError('Data source sync already in progress');
            }

            await tx.dataSource.update({
                where: { id: dataSourceId },
                data: { isSyncing: true, updatedAt: new Date() },
            });

            axios({
                baseURL: this.configService.get<string>('BASE_API_GATEWAY_URL')!,
                url: snakeCase(dataSource.type.name),
                method: 'post',
                data: {
                    dataSourceId,
                    userId: user.idUser,
                },
            });
        });
    }

    async completedImports(dataSourceIds: string[]) {
        this.logger.log(`Updating data source ${dataSourceIds}`, 'DataSource');

        await this.prisma.dataSource.updateMany({
            where: {
                id: {
                    in: dataSourceIds,
                },
            },
            data: {
                lastSync: new Date(),
                isSyncing: false,
                updatedAt: new Date(),
            },
        });
    }

    private async testDataSourceConnection(
        dataSourceTypeName: string,
        secret: string,
        externalId?: string,
    ): Promise<{ isValid: boolean; message: string }> {
        const decryptedSecret = this.rsaService.decrypt(secret);

        switch (dataSourceTypeName) {
            case DataSourceTypeName.NOTION: {
                const validity = await new NotionWrapper(decryptedSecret).testConnection();
                return { isValid: validity, message: validity ? '' : 'Invalid token' };
            }
            case DataSourceTypeName.GOOGLE_DRIVE: {
                const validity = await new GoogleDriveService(decryptedSecret).testConnection();
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

    private checkIsOrganizationAdmin(reqOrgId: string, userOrgId: string, role: string): void {
        if (
            ![OganizationUserRole.ORG_ADMIN || OganizationUserRole.ORG_OWNER].includes(role as OganizationUserRole) ||
            reqOrgId !== userOrgId
        ) {
            this.logger.error('User is not an admin of the specified org', 'DataSource');
            throw new AccessDeniedError();
        }
    }

    private verifyRequiredCredentialTypesProvided(
        requiredFields: string[],
        createParams: CreateDataSourceQueryDto,
    ): void {
        requiredFields.forEach((field) => {
            if (!createParams[field]) {
                throw new BadRequestError('Missing required credentials for DataSource type');
            }
        });
    }
}
