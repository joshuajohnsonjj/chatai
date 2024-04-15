import { IsEmail, IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DataSyncInterval, UserInviteType } from '@prisma/client';

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

export class InvitUserQueryDto {
    @IsEmail()
    inviteEmail: string;

    @IsString()
    @MaxLength(40)
    @MinLength(1)
    firstName: string;

    @IsEnum(UserInviteType)
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
