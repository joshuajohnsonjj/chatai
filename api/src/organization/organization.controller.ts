import { Controller, Get, Param, Body, Post, Request, Delete } from '@nestjs/common';
import { OrganizationService } from './organization.service';
// import { AuthGuard } from '@nestjs/passport';
import {
    CreateOrganizationQueryDto,
    InvitUserQueryDto,
    InviteResponseDto,
    OrganizationResponseDto,
} from './dto/organization.dto';

@Controller('organization')
// @UseGuards(AuthGuard('jwt'))
export class OrganizationController {
    constructor(private readonly service: OrganizationService) {}

    @Post()
    async createOrganization(
        @Body() body: CreateOrganizationQueryDto,
        @Request() req,
    ): Promise<OrganizationResponseDto> {
        return this.service.createOrganization(body, req.user);
    }

    @Get('/:organizationId')
    async getOrganizationById(@Param() orgId: string): Promise<OrganizationResponseDto> {
        return this.service.getOrganizationById(orgId);
    }

    @Post('/:organizationId/invite')
    async createOrgInvite(
        @Param() orgId: string,
        @Body() body: InvitUserQueryDto,
        @Request() req,
    ): Promise<InviteResponseDto> {
        return await this.service.createOrgInvite(orgId, body, req.user);
    }

    @Post('/:organizationId/invite/:invitationId/resend')
    async resendOrgInvite(
        @Param() orgId: string,
        @Param() invitationId: string,
        @Request() req,
    ): Promise<InviteResponseDto> {
        return await this.service.resendOrgInvite(orgId, invitationId, req.user);
    }

    // TODO:
    @Delete('/:organizationId/invite/:invitationId')
    async revokeOrgInvite(
        @Param() orgId: string,
        @Param() invitationId: string,
        @Request() req,
    ): Promise<{ success: boolean }> {
        await this.service.revokeOrgInvite(orgId, invitationId, req.user);
        return { success: true };
    }

    @Get('/:organizationId/invite')
    async listOrganizationInvites(@Param() orgId: string, @Request() req): Promise<InviteResponseDto[]> {
        return await this.service.listOrganizationInvites(orgId, req.user);
    }

    // TODO:
    @Delete('/:organizationId/member/:userId')
    async revokeOrgUserAccesse(
        @Param() orgId: string,
        @Param() userId: string,
        @Request() req,
    ): Promise<InviteResponseDto> {
        return await this.service.revokeOrgUserAccesse(orgId, userId, req.user);
    }
}
// TODO: verify request object type w/ user -> create type