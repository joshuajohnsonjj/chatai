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
    TestCredentialsQueryDto,
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
import { DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';
import { type APIGatewayInitiateImportParams, CognitoAttribute, OganizationUserRole, PrismaError } from 'src/types';
import { omit } from 'lodash';
import { initiateDataSourceImport, testDataSourceConnection } from 'src/services/apiGateway';
import * as moment from 'moment';
import { createEventBridgeScheduledExecution, deleteEventBridgeSchedule } from 'src/services/eventBridge';
import { BYTES_IN_MB, LoggerContext } from 'src/constants';
import { AdditionalConfigTemplate } from 'src/types/prismaJson';

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
        const userInfo = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.idUser },
            select: { type: true },
        });

        this.logger.log(
            `Creating new data source for ${userInfo.type} - ${params.ownerEntityId}`,
            LoggerContext.DATA_SOURCE,
        );

        if (userInfo.type === UserType.ORGANIZATION_MEMBER) {
            this.checkIsOrganizationAdmin(params.ownerEntityId, user.organization, user.oganizationUserRole);
        } else if (params.ownerEntityId !== user.idUser) {
            this.logger.error(
                `User ${user.idUser} does not match ${params.ownerEntityId}`,
                undefined,
                LoggerContext.DATA_SOURCE,
            );
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

        await this.validateRequestedSyncInterval(params.selectedSyncInterval, userInfo.type, params.ownerEntityId);

        try {
            const dataSource = await this.prisma.dataSource.create({
                data: {
                    dataSourceTypeId: params.dataSourceTypeId,
                    ownerEntityId: params.ownerEntityId,
                    ownerEntityType:
                        userInfo.type === UserType.ORGANIZATION_MEMBER
                            ? EntityType.ORGANIZATION
                            : EntityType.INDIVIDUAL,
                    secret: params.secret,
                    refreshToken: params.refreshToken,
                    externalId: params.externalId,
                    selectedSyncInterval: params.selectedSyncInterval,
                    lastSync: params.backfillHistoricalStartDate,
                    additionalConfig: JSON.stringify(params.additionalConfiguration ?? {}),
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
                secret: true,
                refreshToken: true,
                lastSync: true,
                type: { select: { name: true } },
            },
        });

        if (dataSource.ownerEntityId !== user.idUser && dataSource.ownerEntityId !== user.organization) {
            this.logger.error(
                `User ${user.idUser} blocked from updating datasource ${dataSourceId}`,
                undefined,
                LoggerContext.DATA_SOURCE,
            );
            throw new AccessDeniedError('User unauthorized to modify this data source');
        }

        const updates: any = {};

        if (params.syncInterval) {
            await this.validateRequestedSyncInterval(params.syncInterval, userInfo.type, dataSource.ownerEntityId);
            updates.selectedSyncInterval = params.syncInterval;
        }

        if (params.secret) {
            const { isValid, message } = await testDataSourceConnection(
                this.configService.get<string>('BASE_API_GATEWAY_URL')!,
                this.configService.get<string>('API_GATEWAY_KEY')!,
                {
                    dataSourceTypeName: dataSource.type.name,
                    secret: params.secret,
                },
            );

            if (!isValid) {
                this.logger.warn(`Invalid credentials: ${message}`, LoggerContext.DATA_SOURCE);
                throw new BadCredentialsError(message);
            }

            updates.secret = params.secret;
            updates.refreshToken = params.refreshToken;
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.dataSource.update({
                where: { id: dataSourceId },
                data: updates,
            });

            if (params.syncInterval) {
                await this.updateSyncSchedule(
                    params.syncInterval,
                    {
                        dataSourceId,
                        dataSourceType: dataSource.type.name,
                        secret: dataSource.secret,
                        refreshToken: dataSource.refreshToken ?? undefined,
                        ownerEntityId: dataSource.ownerEntityId,
                        lastSync: dataSource.lastSync?.toISOString() ?? null,
                    },
                    true,
                );
            }
        });
    }

    async testDataSourceCredential(params: TestCredentialsQueryDto): Promise<TestDataSourceResponseDto> {
        return await testDataSourceConnection(
            this.configService.get<string>('BASE_API_GATEWAY_URL')!,
            this.configService.get<string>('API_GATEWAY_KEY')!,
            {
                dataSourceTypeName: params.dataSourceTypeName,
                secret: params.secret,
                externalId: params.externalId,
            },
        );
    }

    async listDataSourceTypes(): Promise<ListDataSourceTypesResponseDto[]> {
        const queryRes = await this.prisma.dataSourceType.findMany({
            select: {
                id: true,
                name: true,
                category: true,
                isLiveSyncAvailable: true,
                isManualSyncAllowed: true,
                additionalConfigTemplate: true,
            },
        });

        return queryRes.map((type) => ({
            ...type,
            additionalConfigTemplate: type.additionalConfigTemplate as AdditionalConfigTemplate,
        }));
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

        const dataSource = await this.prisma.dataSource.findUnique({
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
            this.logger.error(
                `Blocked user ${user.idUser} from syncing datasource ${dataSourceId}`,
                undefined,
                LoggerContext.DATA_SOURCE,
            );
            throw new AccessDeniedError('User not associated with this data source');
        }

        if (dataSource.isSyncing) {
            this.logger.error(`Data source ${dataSourceId} already syncing`, undefined, LoggerContext.DATA_SOURCE);
            throw new BadRequestError('Data source sync already in progress');
        }

        initiateDataSourceImport(
            this.configService.get<string>('BASE_API_GATEWAY_URL')!,
            this.configService.get<string>('API_GATEWAY_KEY')!,
            dataSource.type.name,
            {
                dataSourceId,
                dataSourceType: dataSource.type.name,
                secret: dataSource.secret,
                refreshToken: dataSource.refreshToken ?? undefined,
                ownerEntityId: user.organization || user.idUser,
                lastSync: dataSource.lastSync?.toISOString() ?? null,
            },
        );
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
            this.logger.error(`Data source ${dataSourceId} already syncing`, undefined, LoggerContext.DATA_SOURCE);
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
    async handleImportsCompleted(
        data: CompletedImportsRequestDto,
        apiKey: string,
        ignoreAPIKey = false,
    ): Promise<void> {
        if (!ignoreAPIKey) {
            await this.validateInternalAPIKey(apiKey);
        }

        this.logger.log('Starting handle data source post sync job', LoggerContext.DATA_SOURCE);

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
                        selectedSyncInterval: true,
                        secret: true,
                        refreshToken: true,
                        nextScheduledSync: true,
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

                const nextScheduledSync = this.syncIntervalToNextSyncDate(
                    queryRes.selectedSyncInterval,
                    queryRes.type.isLiveSyncAvailable,
                );

                const isLiveSyncingDataSource =
                    queryRes.type.isLiveSyncAvailable && queryRes.selectedSyncInterval === DataSyncInterval.INSTANT;

                await Promise.all([
                    !isLiveSyncingDataSource && !queryRes.nextScheduledSync
                        ? this.updateSyncSchedule(queryRes.selectedSyncInterval, {
                              dataSourceId: completed.dataSourceId,
                              dataSourceType: queryRes.type.name,
                              secret: queryRes.secret,
                              refreshToken: queryRes.refreshToken ?? undefined,
                              ownerEntityId: queryRes.ownerEntityId,
                              lastSync: new Date().toISOString(),
                          })
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
            this.logger.error('No valid key provided in api-key header', undefined, LoggerContext.DATA_SOURCE);
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
            this.logger.error(
                `Owner entity ${ownerEntityId} requested unallowed interval ${requested}`,
                undefined,
                LoggerContext.DATA_SOURCE,
            );
            throw new BadRequestError('Current plan does not allow this indexing interval');
        }
    }

    private async updateSyncSchedule(
        syncInterval: DataSyncInterval,
        schedulerData: APIGatewayInitiateImportParams,
        shouldDeleteOldSchedule = false,
    ) {
        if (shouldDeleteOldSchedule) {
            await deleteEventBridgeSchedule(schedulerData.dataSourceId, this.logger);
        }

        await createEventBridgeScheduledExecution(syncInterval, schedulerData, this.logger);
    }

    private syncIntervalToNextSyncDate(interval: DataSyncInterval, isLiveSyncAvailable: boolean): Date | null {
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
    }
}
