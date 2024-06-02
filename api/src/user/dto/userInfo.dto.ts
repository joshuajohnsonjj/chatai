import { ChatTone, DataSyncInterval, UserType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsBooleanString,
    IsEmail,
    IsEnum,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

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

export class UpdateUserInfoRequestDto {
    @IsString()
    @IsOptional()
    @MaxLength(20)
    firstName?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    lastName?: string;

    @IsEmail()
    @IsOptional()
    @MaxLength(40)
    email?: string;

    @IsPhoneNumber()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    accessToken: string;
}

export class UpdateUserSettingsRequestDto {
    @IsBoolean()
    @IsOptional()
    newsletterNotification?: boolean;

    @IsBoolean()
    @IsOptional()
    usageNotification?: boolean;

    @IsNumber()
    @Max(9)
    @Min(1)
    @IsOptional()
    chatCreativity?: number;

    @IsNumber()
    @Max(9)
    @Min(1)
    @IsOptional()
    chatMinConfidence?: number;

    @IsEnum(ChatTone)
    @IsOptional()
    chatTone?: ChatTone;

    @IsString()
    @MaxLength(240)
    @IsOptional()
    baseInstructions?: string;
}

export class SetProfileImageRequestDto {
    @IsString()
    imageBase64: string;

    @IsString()
    fileType: string;
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
    photoUrl: string | null;
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
