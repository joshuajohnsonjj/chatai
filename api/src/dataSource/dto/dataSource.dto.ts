import { DataSourceCategory, DataSourceTypeName, DataSyncInterval, EntityType, UserType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class CreateDataSourceQueryDto {
    @IsUUID()
    dataSourceTypeId: string;

    @IsUUID()
    ownerEntityId: string;

    @IsString()
    userType: UserType;

    @IsString()
    secret: string;

    @IsBoolean()
    backfillHistorical: boolean;

    @IsEnum(DataSyncInterval)
    selectedSyncInterval: DataSyncInterval;

    @IsString()
    @IsOptional()
    externalId?: string;
}

export class UpdateDataSourceQueryDto {
    @IsString()
    userType: UserType;

    @IsEnum(DataSyncInterval)
    @IsOptional()
    syncInterval?: DataSyncInterval;
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
}

export class ListDataSourceConnectionsResponseDto extends DataSourceConnectionDto {
    dataSourceName: string;
    dataSourceLiveSyncAvailable: boolean;
    hasExternalId: boolean;
}

export class ListDataSourceTypesResponseDto {
    id: string;
    name: DataSourceTypeName;
    category: DataSourceCategory;
    isLiveSyncAvailable: boolean;
}
