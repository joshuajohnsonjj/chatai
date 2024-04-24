import { UserType } from '@prisma/client';
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
}

export class GetUserInfoResponseDto {
    // id: string;
    // createdAt: Date;
    // updatedAt: Date;
    // type: UserType;
    // planId: string | null;
    // organizationId: string | null;
    // email: string;
    // firstName: string;
    // lastName: string;
    // phoneNumber: string | null;
    // stripeCustomerId: string | null;
    // organization: {
    //     id: string;
    //     createdAt: Date;
    //     updatedAt: Date;
    //     planId: string;
    //     isAccountActive: boolean;
    //     name: string;
    // } | null;
    // plan: {
    //     id: string;
    //     createdAt: Date;
    //     updatedAt: Date;
    //     isActive: boolean;
    //     adHocUploadsEnabled: boolean;
    //     dailyMessageQuota: number;
    //     dataSyncInterval: string;
    //     integrationsEnabled: boolean;
    //     maxDataSources: number;
    //     stripeProductId: string;
    // } | null;
}
