import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationQueryDto, OrganizationResponseDto } from './dto/organization.dto';
import { STRIPE_PRODUCTS } from 'src/constants/stripe';
import { UserType } from '@prisma/client';
import { createCustomer } from 'src/services/stripe';
import { ResourceNotFoundError } from 'src/exceptions';

@Injectable()
export class OrganizationService {
    constructor(private readonly prisma: PrismaService) {}

    async createOrganization(params: CreateOrganizationQueryDto): Promise<OrganizationResponseDto> {
        const ownerUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: params.ownerUserId },
            select: { email: true },
        });
        const stripeCustomer = await createCustomer(params.name, ownerUser.email);

        const accountPlan = await this.prisma.accountPlan.findUniqueOrThrow({
            where: { stripeProductId: STRIPE_PRODUCTS.ORGANIZATION },
        });

        // create org
        const organization = await this.prisma.organization.create({
            data: {
                planId: accountPlan.id,
                name: params.name,
            },
        });

        // update owner
        await this.prisma.user.update({
            where: { id: params.ownerUserId },
            data: {
                organizationId: organization.id,
                type: UserType.ORGANIZATION_OWNER,
                stripeCustomerId: stripeCustomer.id,
            },
        });

        return {
            id: organization.id,
            name: organization.name,
            planId: organization.planId,
            plan: {
                isActive: accountPlan.isActive,
                maxDataSources: accountPlan.maxDataSources,
                dataSyncInterval: accountPlan.dataSyncInterval,
                dailyMessageQuota: accountPlan.dailyMessageQuota,
                adHocUploadsEnabled: accountPlan.adHocUploadsEnabled,
                integrationsEnabled: accountPlan.integrationsEnabled,
            },
        };
    }

    async getOrganizationById(orgId: string): Promise<OrganizationResponseDto> {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                planId: true,
                plan: {
                    select: {
                        isActive: true,
                        maxDataSources: true,
                        dataSyncInterval: true,
                        dailyMessageQuota: true,
                        adHocUploadsEnabled: true,
                        integrationsEnabled: true,
                    },
                },
            },
        });

        if (!organization) {
            throw new ResourceNotFoundError(orgId, 'Organization');
        }

        return {
            id: organization.id,
            name: organization.name,
            planId: organization.planId,
            plan: {
                isActive: organization.plan?.isActive,
                maxDataSources: organization.plan?.maxDataSources,
                dataSyncInterval: organization.plan?.dataSyncInterval,
                dailyMessageQuota: organization.plan?.dailyMessageQuota,
                adHocUploadsEnabled: organization.plan?.adHocUploadsEnabled,
                integrationsEnabled: organization.plan?.integrationsEnabled,
            },
        };
    }
}
