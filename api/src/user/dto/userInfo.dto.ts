import { ChatTone, DataSyncInterval, UserType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsOptional } from 'class-validator';

export class GetUserInfoRequestDto {
    @IsBooleanString()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeOrg: boolean;

    @IsBooleanString()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeAccountPlan: boolean;

    @IsBooleanString()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeSettings: boolean;
}

export class GetUserInfoResponseDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: UserType;
    planId: string | null;
    organizationId: string | null;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    stripeCustomerId: string | null;
    organization: {
        id: string;
        planId: string;
        isAccountActive: boolean;
        name: string;
    } | null;
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
    } | null;
    settings: {
        newsletterNotification: boolean;
        usageNotification: boolean;
        chatCreativity: number;
        chatMinConfidence: number;
        chatTone: ChatTone;
        baseInstructions: string | null;
    } | null;
}
