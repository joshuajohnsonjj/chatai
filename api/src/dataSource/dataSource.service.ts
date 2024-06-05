import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
    CreateDataSourceQueryDto,
    TestDataSourceResponseDto,
    ListDataSourceConnectionsResponseDto,
    ListDataSourceTypesResponseDto,
    UpdateDataSourceQueryDto,
    CompletedImportsRequestDto,
    DataSourceConnectionDto,
} from './dto/dataSource.dto';
import { DataSource, DataSyncInterval, EntityType, InternalAPIKeyScope, UserType } from '@prisma/client';
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
import { createEventBridgeScheduledExecution } from 'src/services/eventBridge';
import { BYTES_IN_MB, LoggerContext } from 'src/constants';

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
    ): Promise<DataSourceConnectionDto> {
        this.logger.log(
            `Creating new data source for ${params.ownerEntityType} - ${params.ownerEntityId}`,
            LoggerContext.DATA_SOURCE,
        );

        if (params.ownerEntityType === UserType.ORGANIZATION_MEMBER) {
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
            this.logger.error('Invalid data source credential', LoggerContext.DATA_SOURCE);
            throw new BadCredentialsError(message);
        }

        await this.validateRequestedSyncInterval(
            params.selectedSyncInterval,
            params.ownerEntityType,
            params.ownerEntityId,
        );

        try {
            const dataSource = await this.prisma.dataSource.create({
                data: {
                    dataSourceTypeId: params.dataSourceTypeId,
                    ownerEntityId: params.ownerEntityId,
                    ownerEntityType:
                        params.ownerEntityType === UserType.ORGANIZATION_MEMBER
                            ? EntityType.ORGANIZATION
                            : EntityType.INDIVIDUAL,
                    secret: params.secret,
                    refreshToken: params.refreshToken,
                    externalId: params.externalId,
                    selectedSyncInterval: params.selectedSyncInterval,
                    lastSync: params.backfillHistoricalStartDate,
                },
            });

            this.syncDataSource(dataSource.id, user);

            return {
                ...omit(dataSource, ['secret', 'isSyncing']),
                isSyncing: true,
            };
        } catch (e) {
            if (e.code === PrismaError.FAILED_UNIQUE_CONSTRAINT) {
                this.logger.error(
                    "Failed unique constraint - couldn't create datasource",
                    undefined,
                    LoggerContext.DATA_SOURCE,
                );
                throw new BadRequestError('Data source already exists for entity');
            }

            this.logger.error(e.message, e.stack, LoggerContext.DATA_SOURCE);
            throw new InternalError();
        }
    }

    async updateDataSource(
        dataSourceId: string,
        params: UpdateDataSourceQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<void> {
        this.logger.log(`Updating new data source ${dataSourceId}`, LoggerContext.DATA_SOURCE);

        const userInfo = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.idUser },
            select: { type: true },
        });

        if (userInfo.type === UserType.ORGANIZATION_MEMBER) {
            this.checkIsOrganizationAdmin(user.organization, user.organization, user.oganizationUserRole);
        }

        const dataSource = await this.prisma.dataSource.findUniqueOrThrow({
            where: { id: dataSourceId },
            select: {
                ownerEntityId: true,
            },
        });

        if (dataSource.ownerEntityId !== user.idUser && dataSource.ownerEntityId !== user.organization) {
            throw new AccessDeniedError('User unauthorized to modify this data source');
        }

        const updates: Partial<DataSource> = {};

        if ('syncInterval' in params) {
            await this.validateRequestedSyncInterval(params.syncInterval!, userInfo.type, dataSource.ownerEntityId);
            updates.selectedSyncInterval = params.syncInterval;
        }

        // TODO: test connection if updating credentials

        await this.prisma.dataSource.update({
            where: { id: dataSourceId },
            data: updates,
        });
    }

    async testDataSourceCredential(
        params: CreateDataSourceQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<TestDataSourceResponseDto> {
        this.logger.log(`Testing data source credential for entity ${params.ownerEntityId}`, LoggerContext.DATA_SOURCE);

        if (params.ownerEntityType === UserType.ORGANIZATION_MEMBER) {
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
        this.logger.log(`Destroying google drive webhook connection for ${dataSourceId}`, LoggerContext.DATA_SOURCE);

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
            throw new ResourceNotFoundError(dataSourceId, LoggerContext.DATA_SOURCE);
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
        this.logger.log(`Creating google drive webhook connection for ${dataSourceId}`, LoggerContext.DATA_SOURCE);

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
            throw new ResourceNotFoundError(dataSourceId, LoggerContext.DATA_SOURCE);
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
                isManualSyncAllowed: true,
            },
        });

        return queryRes;
    }

    async listUserDataSourceConnections(user: DecodedUserTokenDto): Promise<ListDataSourceConnectionsResponseDto[]> {
        const entityId = user.organization || user.idUser;

        const queryRes = await this.prisma.dataSource.findMany({
            where: { ownerEntityId: entityId },
            include: { type: true },
        });

        return queryRes.map((item) => ({
            ...omit(item, ['externalId', 'type', 'secret', 'refreshToken']),
            hasExternalId: !!item.externalId,
            dataSourceName: item.type.name,
            dataSourceLiveSyncAvailable: item.type.isLiveSyncAvailable,
            dataSourceManualSyncAllowed: item.type.isManualSyncAllowed,
        }));
    }

    async syncDataSource(dataSourceId: string, user: DecodedUserTokenDto): Promise<void> {
        this.logger.log(`Starting data source sync for data source: ${dataSourceId}`, LoggerContext.DATA_SOURCE);

        await this.prisma.$transaction(async (tx) => {
            const dataSource = await tx.dataSource.findUnique({
                where: { id: dataSourceId },
                select: {
                    isSyncing: true,
                    ownerEntityId: true,
                    secret: true,
                    refreshToken: true,
                    lastSync: true,
                    type: { select: { name: true } },
                },
            });

            if (!dataSource) {
                this.logger.error(`Data source ${dataSourceId} not found`, undefined, LoggerContext.DATA_SOURCE);
                throw new ResourceNotFoundError(dataSourceId, LoggerContext.DATA_SOURCE);
            }

            if (dataSource.ownerEntityId !== user.idUser && dataSource.ownerEntityId !== user[CognitoAttribute.ORG]) {
                throw new AccessDeniedError('User not associated with this data source');
            }

            if (dataSource.isSyncing) {
                this.logger.error(`Data source ${dataSourceId} already syncing`, undefined, LoggerContext.DATA_SOURCE);
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
                    refreshToken: dataSource.refreshToken ?? undefined,
                    ownerEntityId: user.organization || user.idUser,
                    lastSync: dataSource.lastSync?.toISOString() ?? null,
                },
            );
        });
    }

    async handleImportInitiated(dataSourceId: string, apiKey: string, ignoreAPIKey = false): Promise<void> {
        if (!ignoreAPIKey) {
            await this.validateInternalAPIKey(apiKey);
        }

        const dataSource = await this.prisma.dataSource.findUnique({
            where: { id: dataSourceId },
            select: { isSyncing: true },
        });

        if (dataSource?.isSyncing) {
            throw new BadRequestError('Data source sync already in progress');
        }

        this.logger.log(`handling import initiated for datasource ${dataSourceId}`, LoggerContext.DATA_SOURCE);

        await this.prisma.dataSource.update({
            where: { id: dataSourceId },
            data: {
                isSyncing: true,
                updatedAt: new Date(),
            },
        });
    }

    // TODO: in addition to handling completion, need to handle error state out of either lambda...
    // TODO: create google drive webhook conn if userId present in payload
    async handleImportsCompleted(
        data: CompletedImportsRequestDto,
        apiKey: string,
        ignoreAPIKey = false,
    ): Promise<void> {
        if (!ignoreAPIKey) {
            await this.validateInternalAPIKey(apiKey);
        }

        const syncIntervalToNextSyncDate = (interval: DataSyncInterval, isLiveSyncAvailable: boolean): Date | null => {
            if (interval === DataSyncInterval.INSTANT && isLiveSyncAvailable) {
                return null;
            }

            switch (interval) {
                case DataSyncInterval.INSTANT:
                    return moment().add(15, 'm').toDate();
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
            data.completed.map(async (completed) => {
                this.logger.log(
                    `Updating data source for completed import ${completed.dataSourceId}`,
                    LoggerContext.DATA_SOURCE,
                );

                const queryRes = await this.prisma.dataSource.findUnique({
                    where: { id: completed.dataSourceId },
                    select: {
                        ownerEntityId: true,
                        ownerEntityType: true,
                        selectedSyncInterval: true,
                        secret: true,
                        lastSync: true,
                        type: {
                            select: {
                                name: true,
                                isLiveSyncAvailable: true,
                            },
                        },
                    },
                });

                if (!queryRes) {
                    this.logger.warn(
                        `Query returned no results for ${completed.dataSourceId}`,
                        LoggerContext.DATA_SOURCE,
                    );
                    return;
                }

                const nextScheduledSync = syncIntervalToNextSyncDate(
                    queryRes.selectedSyncInterval,
                    queryRes.type.isLiveSyncAvailable,
                );

                await Promise.all([
                    nextScheduledSync
                        ? createEventBridgeScheduledExecution(
                              this.configService.get<string>('AWS_REGION')!,
                              this.configService.get<string>(`INITIATE_${queryRes.type.name}_LAMBDA_ARN`)!,
                              this.logger,
                              nextScheduledSync,
                              {
                                  dataSourceId: completed.dataSourceId,
                                  dataSourceType: queryRes.type.name,
                                  secret: queryRes.secret,
                                  ownerEntityId: queryRes.ownerEntityId,
                                  lastSync: new Date().toISOString(),
                              },
                          )
                        : Promise.resolve(),
                    this.prisma.dataSource.update({
                        where: { id: completed.dataSourceId },
                        data: {
                            lastSync: new Date(),
                            isSyncing: false,
                            nextScheduledSync,
                            mbStorageEstimate: {
                                increment: completed.bytesDelta / BYTES_IN_MB,
                            },
                            updatedAt: new Date(),
                        },
                    }),
                ]);
            }),
        );
    }

    private async validateInternalAPIKey(apiKey: string): Promise<void> {
        const keyRes = await this.prisma.internalAPIKey.count({
            where: {
                key: apiKey,
                isDisabled: false,
                scopes: {
                    hasSome: [InternalAPIKeyScope.ALL, InternalAPIKeyScope.DATA_SOURCE],
                },
            },
        });

        if (!apiKey || keyRes !== 1) {
            throw new AccessDeniedError('Valid API key not provided in `api-key` header');
        }
    }

    private checkIsOrganizationAdmin(reqOrgId: string, userOrgId: string, role: string): void {
        if (
            ![OganizationUserRole.ORG_ADMIN || OganizationUserRole.ORG_OWNER].includes(role as OganizationUserRole) ||
            reqOrgId !== userOrgId
        ) {
            this.logger.error('User is not an admin of the specified org', LoggerContext.DATA_SOURCE);
            throw new AccessDeniedError('Must be an organization admin to preform this action.');
        }
    }

    private async getAccountPlanMaxSyncInterval(
        isOrganization: boolean,
        id: string,
    ): Promise<DataSyncInterval | undefined> {
        if (!isOrganization) {
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
    }

    private async validateRequestedSyncInterval(
        requested: DataSyncInterval,
        userType: UserType,
        ownerEntityId: string,
    ): Promise<void> {
        const intervalLevels = [
            DataSyncInterval.WEEKLY,
            DataSyncInterval.DAILY,
            DataSyncInterval.SEMI_DAILY,
            DataSyncInterval.INSTANT,
        ];
        const planInterval = await this.getAccountPlanMaxSyncInterval(
            userType === UserType.ORGANIZATION_MEMBER,
            ownerEntityId,
        );

        if (intervalLevels.indexOf(planInterval!) < intervalLevels.indexOf(requested)) {
            throw new BadRequestError('Current plan does not allow this indexing interval');
        }
    }
}
