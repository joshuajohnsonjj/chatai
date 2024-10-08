/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSourceCategory, DataSourceTypeName, DataSyncInterval, EntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import type { AdditionalConfigTemplate, DataSourceAdditonalConfig } from 'src/types/prismaJson';

export class CreateDataSourceQueryDto {
    @IsUUID()
    dataSourceTypeId: string;

    @IsUUID()
    ownerEntityId: string;

    @IsString()
    secret: string;

    @IsDateString()
    @IsOptional()
    backfillHistoricalStartDate?: string;

    @IsEnum(DataSyncInterval)
    selectedSyncInterval: DataSyncInterval;

    @IsString()
    @IsOptional()
    externalId?: string;

    @IsString()
    @IsOptional()
    refreshToken?: string;

    @IsOptional()
    additionalConfiguration?: DataSourceAdditonalConfig;
}

export class TestCredentialsQueryDto {
    @IsString()
    dataSourceTypeName: string;

    @IsString()
    secret: string;

    @IsString()
    @IsOptional()
    externalId?: string;
}

export class UpdateDataSourceQueryDto {
    @IsEnum(DataSyncInterval)
    @IsOptional()
    syncInterval?: DataSyncInterval;

    @IsString()
    @IsOptional()
    secret?: string;

    @IsString()
    @IsOptional()
    refreshToken?: string;
}

class CompletedImport {
    @IsUUID()
    dataSourceId: string;

    @IsNumber()
    bytesDelta: number;

    @IsUUID()
    @IsOptional()
    userId?: string;
}

export class CompletedImportsRequestDto {
    @IsArray({ each: true })
    @ValidateNested({ each: true })
    @Type(() => CompletedImport)
    completed: CompletedImport[];
}

export class DeleteGoogleDriveWebookQueryDto {
    @IsUUID()
    dataSourceId: string;
}

export class TestDataSourceResponseDto {
    isValid: boolean;
    message: string;
}

export class DataSourceConnectionDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    lastSync: Date | null;
    dataSourceTypeId: string;
    ownerEntityId: string;
    ownerEntityType: EntityType;
    isSyncing: boolean;
    selectedSyncInterval: DataSyncInterval;
    nextScheduledSync: Date | null;
    additionalConfig: any;
}

export class ListDataSourceConnectionsResponseDto extends DataSourceConnectionDto {
    dataSourceName: string;
    dataSourceLiveSyncAvailable: boolean;
    dataSourceManualSyncAllowed: boolean;
    hasExternalId: boolean;
}

export class ListDataSourceTypesResponseDto {
    id: string;
    name: DataSourceTypeName;
    category: DataSourceCategory;
    isLiveSyncAvailable: boolean;
    isManualSyncAllowed: boolean;
    additionalConfigTemplate: AdditionalConfigTemplate | null;
}
