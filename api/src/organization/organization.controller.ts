import { Controller, Get, Param, Body, Post } from '@nestjs/common';
import { OrganizationService } from './organization.service';
// import { AuthGuard } from '@nestjs/passport';
import { CreateOrganizationQueryDto, OrganizationResponseDto } from './dto/organization.dto';

@Controller('organization')
// @UseGuards(AuthGuard('jwt'))
export class OrganizationController {
    constructor(private readonly service: OrganizationService) {}

    @Post()
    async createOrganization(@Body() body: CreateOrganizationQueryDto): Promise<OrganizationResponseDto> {
        return this.service.createOrganization(body);
    }

    @Get('/:organizationId')
    async getOrganizationById(@Param() orgId: string): Promise<OrganizationResponseDto> {
        return this.service.getOrganizationById(orgId);
    }
}
