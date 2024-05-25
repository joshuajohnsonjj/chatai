import { Controller, Body, Post, Param, Req, Get, Delete, Patch } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common/decorators';
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
export class DataSourceController {
    constructor(private readonly service: DataSourceService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async listDataSourceTypes(): Promise<ListDataSourceTypesResponseDto[]> {
        return await this.service.listDataSourceTypes();
    }

    @Post('/connections')
    @UseGuards(AuthGuard('jwt'))
    async createDataSource(
        @Body() body: CreateDataSourceQueryDto,
        @Req() req: Request,
    ): Promise<CreateDataSourceResponseDto> {
        return await this.service.createDataSource(body, req.user as DecodedUserTokenDto);
    }

    @Patch('/connections/:dataSourceId')
    @UseGuards(AuthGuard('jwt'))
    async updateDataSource(): Promise<void> {
        return;
    }

    @Post('/connections/test')
    @UseGuards(AuthGuard('jwt'))
    async testDataSourceCredential(
        @Body() body: CreateDataSourceQueryDto,
        @Req() req: Request,
    ): Promise<TestDataSourceResponseDto> {
        return await this.service.testDataSourceCredential(body, req.user as DecodedUserTokenDto);
    }

    @Post('/connections/:dataSourceId/sync')
    @UseGuards(AuthGuard('jwt'))
    async syncDataSource(
        @Param() { dataSourceId }: { dataSourceId: string },
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.syncDataSource(dataSourceId, req.user as DecodedUserTokenDto);
        return { success: true };
    }

    @Get('/connections')
    @UseGuards(AuthGuard('jwt'))
    async listUserDataSourceConnections(@Req() req: Request): Promise<ListDataSourceConnectionsResponseDto[]> {
        return await this.service.listUserDataSourceConnections(req.user as DecodedUserTokenDto);
    }

    @Delete('/connections/webhook/googleDrive')
    @UseGuards(AuthGuard('jwt'))
    async killGoogleDriveWebhookConnection(
        @Body() body: DeleteGoogleDriveWebookQueryDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.killGoogleDriveWebhookConnection(
            body.dataSourceId,
            (req.user as DecodedUserTokenDto).idUser,
        );
        return { success: true };
    }

    @Post('/connections/webhook/googleDrive')
    @UseGuards(AuthGuard('jwt'))
    async createGoogleDriveWebhookConnection(
        @Body() body: DeleteGoogleDriveWebookQueryDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.createGoogleDriveWebhookConnection(
            body.dataSourceId,
            (req.user as DecodedUserTokenDto).idUser,
        );
        return { success: true };
    }

    @Patch('/completedImports')
    async completedImports(@Body() body: { dataSourceIds: string[] }, @Req() req: Request): Promise<void> {
        await this.service.completedImports(body.dataSourceIds, req.headers['api-key'] as string);
    }
}
