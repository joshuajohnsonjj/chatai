import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateOrganizationQueryDto,
    InvitUserQueryDto,
    InviteResponseDto,
    OrganizationResponseDto,
} from './dto/organization.dto';
import { STRIPE_PRODUCTS } from 'src/constants/stripe';
import { UserType } from '@prisma/client';
import { AccessDeniedError, BadRequestError, ResourceNotFoundError } from 'src/exceptions';
import { EmailSubject, Mailer, OrganizationInvite, TemplateIds } from '@joshuajohnsonjj38/mailer';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { UserAuthService } from 'src/userAuth/userAuth.service';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { CognitoAttribute, OganizationUserRole } from 'src/types';
import { ConfigService } from '@nestjs/config';
import { DataSourceService } from 'src/dataSource/dataSource.service';

@Injectable()
export class OrganizationService {
    @Inject(UserAuthService)
    private readonly userAuthService: UserAuthService;

    @Inject(DataSourceService)
    private readonly dataSourceService: DataSourceService;

    constructor(
        private readonly prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async createOrganization(
        params: CreateOrganizationQueryDto,
        ownerUser: DecodedUserTokenDto,
    ): Promise<OrganizationResponseDto> {
        const accountPlan = await this.prisma.accountPlan.findUniqueOrThrow({
            where: { stripeProductId: STRIPE_PRODUCTS.ORGANIZATION },
        });

        const organization = await this.prisma.organization.create({
            data: {
                planId: accountPlan.id,
                name: params.name,
            },
        });

        const user = await this.prisma.user.update({
            where: { id: ownerUser.idUser },
            data: {
                organizationId: organization.id,
                type: UserType.ORGANIZATION_MEMBER,
                updatedAt: new Date(),
            },
            select: { email: true },
        });

        this.userAuthService.updateAttributes(user.email, [
            new CognitoUserAttribute({
                Name: CognitoAttribute.ORG_USER_ROLE,
                Value: OganizationUserRole.ORG_OWNER,
            }),
            new CognitoUserAttribute({ Name: CognitoAttribute.ORG, Value: organization.id }),
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
        this.checkIsOrganizationAdmin(organizationId, user[CognitoAttribute.ORG], user[CognitoAttribute.ORG_USER_ROLE]);

        // TODO: check if user exists already/in other org
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
        });

        if (!org) {
            throw new ResourceNotFoundError(organizationId, 'Organization');
        }

        const inviterUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.idUser },
            select: { firstName: true },
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
            this.sendInviteEmail(body.inviteEmail, body.firstName, inviterUser.firstName, org.name),
        ]);

        return invite;
    }

    async resendOrgInvite(
        organizationId: string,
        inviteId: string,
        user: DecodedUserTokenDto,
    ): Promise<InviteResponseDto> {
        this.checkIsOrganizationAdmin(organizationId, user[CognitoAttribute.ORG], user[CognitoAttribute.ORG_USER_ROLE]);

        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
        });

        if (!org) {
            throw new ResourceNotFoundError(organizationId, 'Organization');
        }

        const inviterUser = await this.prisma.user.findUniqueOrThrow({
            where: { id: user.idUser },
            select: { firstName: true },
        });

        const invite = await this.prisma.userInvite.update({
            where: { id: inviteId },
            data: { resentAt: new Date(), updatedAt: new Date() },
        });
        await this.sendInviteEmail(invite.email, invite.firstName, inviterUser.firstName, org.name);

        return invite;
    }

    async revokeOrgInvite(organizationId: string, invitationId: string, reqUser: DecodedUserTokenDto): Promise<void> {
        this.checkIsOrganizationAdmin(
            organizationId,
            reqUser[CognitoAttribute.ORG],
            reqUser[CognitoAttribute.ORG_USER_ROLE],
        );

        await this.prisma.userInvite.delete({ where: { id: invitationId } });
    }

    async revokeOrgUserAccesse(
        organizationId: string,
        userToRemoveId: string,
        reqUser: DecodedUserTokenDto,
    ): Promise<void> {
        this.checkIsOrganizationAdmin(
            organizationId,
            reqUser[CognitoAttribute.ORG],
            reqUser[CognitoAttribute.ORG_USER_ROLE],
        );

        const userToRemove = await this.prisma.user.findUnique({
            where: { id: userToRemoveId },
            select: {
                organizationId: true,
                email: true,
            },
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

        // if user started google drive webhook connection for org, kill it
        const googleDriveConnection = await this.prisma.googleDriveWebhookConnection.findUnique({
            where: { creatorUserId: reqUser.idUser },
            select: { dataSourceId: true },
        });
        if (googleDriveConnection) {
            await this.dataSourceService.killGoogleDriveWebhookConnection(
                googleDriveConnection.dataSourceId,
                reqUser.idUser,
            );
        }

        // downgrade user to individual free plan
        await Promise.all([
            this.prisma.user.update({
                where: { id: userToRemoveId },
                data: {
                    organizationId: null,
                    type: UserType.INDIVIDUAL,
                    planId: accountPlan.id,
                    updatedAt: new Date(),
                },
            }),
            this.userAuthService.updateAttributes(userToRemove.email, [
                new CognitoUserAttribute({ Name: CognitoAttribute.ORG_USER_ROLE, Value: '' }),
                new CognitoUserAttribute({ Name: CognitoAttribute.ORG, Value: '' }),
            ]),
        ]);
    }

    async listOrganizationInvites(organizationId: string, reqUser: DecodedUserTokenDto): Promise<InviteResponseDto[]> {
        this.checkIsOrganizationAdmin(organizationId, reqUser.organization, reqUser[CognitoAttribute.ORG_USER_ROLE]);

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
        const mailer = new Mailer(this.configService.get<string>('SENDGRID_KEY')!);
        await mailer.sendMessage(inviteEmail, TemplateIds.OrganizationInvite, {
            subject: EmailSubject.OrganizationInvite(orgName),
            senderName: senderName,
            receiverName: inviteName,
            organizationName: orgName,
        } as OrganizationInvite);
    }

    private checkIsOrganizationAdmin(reqOrgId: string, userOrgId: string, role: OganizationUserRole): void {
        if (
            ![OganizationUserRole.ORG_ADMIN || OganizationUserRole.ORG_OWNER].includes(role) ||
            reqOrgId !== userOrgId
        ) {
            throw new AccessDeniedError();
        }
    }
}
