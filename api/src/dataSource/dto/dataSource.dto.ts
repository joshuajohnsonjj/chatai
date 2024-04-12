import { EntityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDataSourceQueryDto {
    @IsUUID()
    dataSourceTypeId: string;

    @IsUUID()
    ownerEntityId: string;

    @IsEnum(EntityType)
    ownerEntityType: EntityType;

    @IsString()
    secret: string;

    @IsString()
    @IsOptional()
    externalId?: string;
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
}
