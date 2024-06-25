import { Controller, Get, Param, Body, Post, Req, Delete, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '@nestjs/passport';
import {
    CreateOrganizationQueryDto,
    InvitUserQueryDto,
    InviteResponseDto,
    OrganizationResponseDto,
} from './dto/organization.dto';
import { Request } from 'express';
import { DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';

@Controller('v1/organization')
@UseGuards(AuthGuard('jwt'))
export class OrganizationController {
    constructor(private readonly service: OrganizationService) {}

    @Post()
    async createOrganization(
        @Body() body: CreateOrganizationQueryDto,
        @Req() req: Request,
    ): Promise<OrganizationResponseDto> {
        return this.service.createOrganization(body, req.user as DecodedUserTokenDto);
    }

    @Get('/:organizationId')
    async getOrganizationById(@Param() orgId: string): Promise<OrganizationResponseDto> {
        return this.service.getOrganizationById(orgId);
    }

    @Post('/:organizationId/invite')
    async createOrgInvite(
        @Param() orgId: string,
        @Body() body: InvitUserQueryDto,
        @Req() req: Request,
    ): Promise<InviteResponseDto> {
        return await this.service.createOrgInvite(orgId, body, req.user as DecodedUserTokenDto);
    }

    @Post('/:organizationId/invite/:invitationId/resend')
    async resendOrgInvite(
        @Param() orgId: string,
        @Param() invitationId: string,
        @Req() req: Request,
    ): Promise<InviteResponseDto> {
        return await this.service.resendOrgInvite(orgId, invitationId, req.user as DecodedUserTokenDto);
    }

    @Delete('/:organizationId/invite/:invitationId')
    async revokeOrgInvite(
        @Param() orgId: string,
        @Param() invitationId: string,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.revokeOrgInvite(orgId, invitationId, req.user as DecodedUserTokenDto);
        return { success: true };
    }

    @Get('/:organizationId/invite')
    async listOrganizationInvites(@Param() orgId: string, @Req() req: Request): Promise<InviteResponseDto[]> {
        return await this.service.listOrganizationInvites(orgId, req.user as DecodedUserTokenDto);
    }

    @Delete('/:organizationId/member/:userId')
    async revokeOrgUserAccesse(
        @Param() orgId: string,
        @Param() userId: string,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.revokeOrgUserAccesse(orgId, userId, req.user as DecodedUserTokenDto);
        return { success: true };
    }
}
