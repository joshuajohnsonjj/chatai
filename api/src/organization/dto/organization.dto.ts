import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DataSyncInterval, UserInviteType } from '@prisma/client';

export class CreateOrganizationQueryDto {
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
        isActive: boolean;
        adHocUploadsEnabled: boolean;
        dailyMessageQuota: number | null;
        dailyQueryQuota: number | null;
        dataSyncInterval: DataSyncInterval;
        integrationsEnabled: boolean;
        maxDataSources: number | null;
        isAdfree: boolean;
        maxStorageMegaBytes: number;
        stripeProductId: string;
    };
}

export class InvitUserQueryDto {
    @IsEmail()
    inviteEmail: string;

    @IsString()
    @MaxLength(40)
    @MinLength(1)
    firstName: string;

    @IsString()
    type: UserInviteType;

    @IsUUID()
    senderId: string;
}

export class InviteResponseDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    resentAt: Date | null;
    email: string;
    firstName: string;
    organizationId: string;
}
