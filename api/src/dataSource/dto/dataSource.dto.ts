import { DataSourceCategory, DataSourceTypeName, DataSyncInterval, EntityType, UserType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class CreateDataSourceQueryDto {
    @IsUUID()
    dataSourceTypeId: string;

    @IsUUID()
    ownerEntityId: string;

    @IsString()
    userType: UserType;

    @IsString()
    secret: string;

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
    dataSourceId: string;
    bytesDelta: number;
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

export class CreateDataSourceResponseDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    lastSync: Date | null;
    dataSourceTypeId: string;
    ownerEntityId: string;
}

export class TestDataSourceResponseDto {
    isValid: boolean;
    message: string;
}

export class ListDataSourceConnectionsResponseDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    lastSync: Date | null;
    dataSourceTypeId: string;
    ownerEntityId: string;
    ownerEntityType: EntityType;
    hasExternalId: boolean;
    isSyncing: boolean;
    dataSourceName: string;
    selectedSyncInterval: DataSyncInterval;
    nextScheduledSync: Date | null;
    dataSourceLiveSyncAvailable: boolean;
}

export class ListDataSourceTypesResponseDto {
    id: string;
    name: DataSourceTypeName;
    category: DataSourceCategory;
    isLiveSyncAvailable: boolean;
}
