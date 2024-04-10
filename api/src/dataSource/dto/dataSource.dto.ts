import { EntityType } from '@prisma/client';
import { IsEnum, IsHash, IsString, IsUUID } from 'class-validator';

export class CreateDataSourceQueryDto {
    @IsUUID()
    dataSourceTypeId: string;

    @IsUUID()
    ownerEntityId: string;

    @IsEnum(EntityType)
    ownerEntityType: EntityType;

    // @IsHash('sha256')
    @IsString()
    secret: string;
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
