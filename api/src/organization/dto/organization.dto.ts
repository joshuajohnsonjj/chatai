import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DataSyncInterval } from '@prisma/client';

export class CreateOrganizationQueryDto {
    @IsUUID()
    ownerUserId: string;

    @IsString()
    @MaxLength(40)
    @MinLength(1)
    name: string;
}

export class OrganizationResponseDto {
    id: string;
    name: string;
    planId: string | null;
    plan: {
        isActive?: boolean;
        maxDataSources?: number;
        dataSyncInterval?: DataSyncInterval;
        dailyMessageQuota?: number | null;
        adHocUploadsEnabled?: boolean;
        integrationsEnabled?: boolean;
    };
}
