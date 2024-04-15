import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateOrganizationQueryDto,
    InvitUserQueryDto,
    InviteResponseDto,
    OrganizationResponseDto,
} from './dto/organization.dto';
import { STRIPE_PRODUCTS } from 'src/constants/stripe';
import { UserType } from '@prisma/client';
import { createCustomer } from 'src/services/stripe';
import { AccessDeniedError, BadRequestError, ResourceNotFoundError } from 'src/exceptions';
import { EmailSubject, Mailer, OrganizationInvite, TemplateIds } from '@joshuajohnsonjj38/mailer';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { UserAuthService } from 'src/userAuth/userAuth.service';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { CognitoAttribute, UserRole } from 'src/types';
import { Logger } from 'winston';

@Injectable()
export class OrganizationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userAuthService: UserAuthService,
        private readonly logger: Logger,
    ) {}

    async createOrganization(
        params: CreateOrganizationQueryDto,
        ownerUser: DecodedUserTokenDto,
    ): Promise<OrganizationResponseDto> {
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
        await Promise.all([
            this.prisma.user.update({
                where: { id: params.ownerUserId },
                data: {
                    organizationId: organization.id,
                    type: UserType.ORGANIZATION_MEMBER,
                    stripeCustomerId: stripeCustomer.id,
                    updatedAt: new Date(),
                },
            }),
            this.userAuthService.updateAttributes(ownerUser.email, [
                new CognitoUserAttribute({ Name: CognitoAttribute.USER_ROLE, Value: UserRole.ORG_OWNER }),
                new CognitoUserAttribute({ Name: CognitoAttribute.ORG, Value: organization.id }),
            ]),
        ]);

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

    async createOrgInvite(
        organizationId: string,
        body: InvitUserQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<InviteResponseDto> {
        this.checkIsOrganizationAdmin(organizationId, user.organization, user.userRole as UserRole);

        // TODO: check if user exists already/in other org

        const org = await this.prisma.organization.findUniqueOrThrow({
            where: { id: organizationId },
            select: { name: true },
        });

        const [invite] = await Promise.all([
            this.prisma.userInvite.create({
                data: {
                    email: body.inviteEmail,
                    firstName: body.firstName,
                    organizationId,
                    type: body.type,
                },
            }),
            this.sendInviteEmail(body.inviteEmail, body.firstName, user.firstName, org.name),
        ]);

        return invite;
    }

    async resendOrgInvite(
        organizationId: string,
        inviteId: string,
        user: DecodedUserTokenDto,
    ): Promise<InviteResponseDto> {
        this.checkIsOrganizationAdmin(organizationId, user.organization, user.userRole as UserRole);

        const org = await this.prisma.organization.findUniqueOrThrow({
            where: { id: organizationId },
            select: { name: true },
        });

        const invite = await this.prisma.userInvite.update({
            where: { id: inviteId },
            data: { resentAt: new Date(), updatedAt: new Date() },
        });
        await this.sendInviteEmail(invite.email, invite.firstName, user.firstName, org.name);

        return invite;
    }

    async revokeOrgInvite(organizationId: string, invitationId: string, reqUser: DecodedUserTokenDto): Promise<void> {
        this.checkIsOrganizationAdmin(organizationId, reqUser.organization, reqUser.userRole as UserRole);

        await this.prisma.userInvite.delete({ where: { id: invitationId } });
    }

    async revokeOrgUserAccesse(organizationId: string, userToRemoveId: string, reqUser: DecodedUserTokenDto): Promise<void> {
        this.checkIsOrganizationAdmin(organizationId, reqUser.organization, reqUser.userRole as UserRole);

        const userToRemove = await this.prisma.user.findUnique({
            where: { id: userToRemoveId },
        });

        if (!userToRemove) {
            throw new ResourceNotFoundError(userToRemoveId, 'User');
        }

        if (userToRemove.organizationId !== organizationId) {
            throw new BadRequestError('User does not belong to your organization');
        }

        const accountPlan = await this.prisma.accountPlan.findUniqueOrThrow({
            where: { stripeProductId: STRIPE_PRODUCTS.INDIVIDUAL_STARTER },
            select: { id: true },
        });

        // downgrade user to individual free plan
        await Promise.all([
            this.prisma.user.update({
                where: { id: userToRemoveId },
                data: {
                    organizationId: null,
                    type: UserType.INDIVIDUAL,
                    planId: accountPlan.id,
                    updatedAt: new Date(),
                }
            }),
            this.userAuthService.updateAttributes(userToRemove.email, [
                new CognitoUserAttribute({ Name: CognitoAttribute.USER_ROLE, Value: '' }),
                new CognitoUserAttribute({ Name: CognitoAttribute.ORG, Value: '' }),
            ]),
        ]);
    }

    async listOrganizationInvites(organizationId: string, reqUser: DecodedUserTokenDto): Promise<InviteResponseDto[]> {
        this.checkIsOrganizationAdmin(organizationId, reqUser.organization, reqUser.userRole as UserRole);
    
        return this.prisma.userInvite.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'asc' },
        });
    }

    private async sendInviteEmail(
        inviteEmail: string,
        inviteName: string,
        senderName: string,
        orgName: string,
    ): Promise<void> {
        const mailer = new Mailer(process.env.SENDGRID_KEY as string);
        await mailer.sendMessage(inviteEmail, TemplateIds.OrganizationInvite, {
            subject: EmailSubject.OrganizationInvite(orgName),
            senderName: senderName,
            receiverName: inviteName,
            organizationName: orgName,
        } as OrganizationInvite);
    }

    private checkIsOrganizationAdmin(reqOrgId: string, userOrgId: string, role: UserRole): void {
        if (
            ![UserRole.ORG_ADMIN || UserRole.ORG_OWNER].includes(role) ||
            reqOrgId !== userOrgId
        ) {
            throw new AccessDeniedError();
        }
    }
}

// TODO: on stripe transaction/subscription creations handle non existant stripe cutomer id
// TODO: rearcitecht a bit to have an org member table? whats the best way to be able to list org users w/ name & email