import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
    CreateDataSourceResponseDto,
    CreateDataSourceQueryDto,
    TestDataSourceResponseDto,
    ListDataSourceConnectionsResponseDto,
    ListDataSourceTypesResponseDto,
} from './dto/dataSource.dto';
import { DataSyncInterval, EntityType, InternalAPIKeyScope, UserType } from '@prisma/client';
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
import { omit } from 'lodash';
import {
    initiateDataSourceImport,
    modifyGoogleDriveWebhookConnection,
    testDataSourceConnection,
} from 'src/services/apiGateway';
import * as moment from 'moment';

@Injectable()
export class DataSourceService {
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

        const { isValid, message } = await testDataSourceConnection(
            this.configService.get<string>('BASE_API_GATEWAY_URL')!,
            this.configService.get<string>('API_GATEWAY_KEY')!,
            {
                dataSourceTypeName: dataSourceType.name,
                secret: params.secret,
                externalId: params.externalId,
            },
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
        this.logger.log(`Testing data source credential for entity ${params.ownerEntityId}`, 'DataSource');

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

        return await testDataSourceConnection(
            this.configService.get<string>('BASE_API_GATEWAY_URL')!,
            this.configService.get<string>('API_GATEWAY_KEY')!,
            {
                dataSourceTypeName: dataSourceType.name,
                secret: params.secret,
                externalId: params.externalId,
            },
        );
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

        await modifyGoogleDriveWebhookConnection(
            this.configService.get<string>('BASE_API_GATEWAY_URL')!,
            this.configService.get<string>('API_GATEWAY_KEY')!,
            false,
            {
                secret: dataSource.secret,
                connectionId: dataSource.googleDriveConnection.connectionId,
                resourceId: dataSource.googleDriveConnection.resourceId,
            },
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

        const response = await modifyGoogleDriveWebhookConnection(
            this.configService.get<string>('BASE_API_GATEWAY_URL')!,
            this.configService.get<string>('API_GATEWAY_KEY')!,
            false,
            {
                secret: dataSource.secret,
                ownerEntityId: dataSource.ownerEntityId,
            },
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

            initiateDataSourceImport(
                this.configService.get<string>('BASE_API_GATEWAY_URL')!,
                this.configService.get<string>('API_GATEWAY_KEY')!,
                dataSource.type.name,
                {
                    dataSourceId,
                    userId: user.idUser,
                    dataSourceType: dataSource.type.name,
                    secret: dataSource.secret,
                    ownerEntityId: user.organization ?? user.idUser,
                    lastSync: dataSource.lastSync?.toISOString() ?? null,
                },
            );
        });
    }

    // TODO: in addition to handling completion, need to handle error state out of either lambda...
    async completedImports(dataSourceIds: string[], apiKey: string) {
        await this.validateInternalAPIKey(apiKey);

        this.logger.log(`Updating data sources for completed import ${dataSourceIds}`, 'DataSource');

        const getAccountPlanSyncInterval = async (
            entityType: EntityType,
            id: string,
        ): Promise<DataSyncInterval | undefined> => {
            if (entityType === EntityType.INDIVIDUAL) {
                const res = await this.prisma.user.findUnique({
                    where: { id },
                    select: { plan: { select: { dataSyncInterval: true } } },
                });
                return res?.plan?.dataSyncInterval;
            }
            const res = await this.prisma.organization.findUnique({
                where: { id },
                select: { plan: { select: { dataSyncInterval: true } } },
            });
            return res?.plan?.dataSyncInterval;
        };

        const syncIntervalToNextSyncDate = (interval: DataSyncInterval, isLiveSyncAvailable: boolean): Date | null => {
            if (interval === DataSyncInterval.INSTANT && isLiveSyncAvailable) {
                return null;
            }

            switch (interval) {
                case DataSyncInterval.INSTANT:
                    return moment().add(30, 'm').toDate();
                case DataSyncInterval.SEMI_DAILY:
                    return moment().add(12, 'h').toDate();
                case DataSyncInterval.DAILY:
                    return moment().add(24, 'h').toDate();
                case DataSyncInterval.WEEKLY:
                default:
                    return moment().add(7, 'd').toDate();
            }
        };

        await Promise.all(
            dataSourceIds.map(async (dataSourceId) => {
                const queryRes = await this.prisma.dataSource.findUnique({
                    where: { id: dataSourceId },
                    select: {
                        ownerEntityId: true,
                        ownerEntityType: true,
                        type: {
                            select: {
                                isLiveSyncAvailable: true,
                            },
                        },
                    },
                });

                if (!queryRes) {
                    this.logger.warn(`Query returned no results for ${dataSourceId}`, 'DataSource');
                    return;
                }

                const syncInterval = await getAccountPlanSyncInterval(queryRes.ownerEntityType, queryRes.ownerEntityId);

                if (!syncInterval) {
                    this.logger.warn(
                        `Failed to retrieve account plan for ${queryRes.ownerEntityType} ${queryRes.ownerEntityId}`,
                        'DataSource',
                    );
                    return;
                }

                // TODO: set cloudwatch event for next sync

                await this.prisma.dataSource.update({
                    where: { id: dataSourceId },
                    data: {
                        lastSync: new Date(),
                        isSyncing: false,
                        nextScheduledSync: syncIntervalToNextSyncDate(syncInterval, queryRes.type.isLiveSyncAvailable),
                        updatedAt: new Date(),
                    },
                });
            }),
        );
    }

    private async validateInternalAPIKey(apiKey: string): Promise<void> {
        const keyRes = await this.prisma.internalAPIKey.findUnique({
            where: {
                key: apiKey,
                isDisabled: false,
                scopes: {
                    hasSome: [InternalAPIKeyScope.ALL, InternalAPIKeyScope.DATA_SOURCE],
                },
            },
            select: { key: true },
        });

        if (!keyRes) {
            throw new AccessDeniedError('Valid API key not provided');
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
