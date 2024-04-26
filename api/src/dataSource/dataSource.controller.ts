import { Controller, Body, Post, Param, Req, Get } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
import { AuthGuard } from '@nestjs/passport';
import { Delete, UseGuards } from '@nestjs/common/decorators';
import {
    CreateDataSourceQueryDto,
    CreateDataSourceResponseDto,
    DeleteGoogleDriveWebookQueryDto,
    ListDataSourceConnectionsResponseDto,
    ListDataSourceTypesResponseDto,
    TestDataSourceResponseDto,
} from './dto/dataSource.dto';
import { Request } from 'express';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';

@Controller('v1/dataSource')
@UseGuards(AuthGuard('jwt'))
export class DataSourceController {
    constructor(private readonly service: DataSourceService) {}

    @Post()
    async createDataSource(
        @Body() body: CreateDataSourceQueryDto,
        @Req() req: Request,
    ): Promise<CreateDataSourceResponseDto> {
        return await this.service.createDataSource(body, req.user as DecodedUserTokenDto);
    }

    @Get()
    async listDataSourceTypes(): Promise<ListDataSourceTypesResponseDto[]> {
        return await this.service.listDataSourceTypes();
    }

    @Get('/connections')
    async listUserDataSourceConnections(@Req() req: Request): Promise<ListDataSourceConnectionsResponseDto[]> {
        return await this.service.listUserDataSourceConnections(req.user as DecodedUserTokenDto);
    }

    @Delete('/connections/webhook/googleDrive')
    async killGoogleDriveWebhookConnection(
        @Body() body: DeleteGoogleDriveWebookQueryDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.killGoogleDriveWebhookConnection(body.dataSourceId, req.user as DecodedUserTokenDto);
        return { success: true };
    }

    @Post('test')
    async testDataSourceCredential(
        @Body() body: CreateDataSourceQueryDto,
        @Req() req: Request,
    ): Promise<TestDataSourceResponseDto> {
        return await this.service.testDataSourceCredential(body, req.user as DecodedUserTokenDto);
    }

    @Post('/:dataSourceId/sync')
    async syncDataSource(@Param() { dataSourceId }: { dataSourceId: string }): Promise<{ success: boolean }> {
        await this.service.syncDataSource(dataSourceId);
        return { success: true };
    }
}
