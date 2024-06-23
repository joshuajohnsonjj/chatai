import { Controller, Body, Post, Param, Req, Get, Patch } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common/decorators';
import type {
    CompletedImportsRequestDto,
    CreateDataSourceQueryDto,
    DataSourceConnectionDto,
    ListDataSourceConnectionsResponseDto,
    ListDataSourceTypesResponseDto,
    TestCredentialsQueryDto,
    TestDataSourceResponseDto,
    UpdateDataSourceQueryDto,
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
    ): Promise<DataSourceConnectionDto> {
        return await this.service.createDataSource(body, req.user as DecodedUserTokenDto);
    }

    @Patch('/connections/:dataSourceId')
    @UseGuards(AuthGuard('jwt'))
    async updateDataSource(
        @Param('dataSourceId') dataSourceId: string,
        @Body() body: UpdateDataSourceQueryDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.updateDataSource(dataSourceId, body, req.user as DecodedUserTokenDto);
        return { success: true };
    }

    @Post('/connections/test')
    @UseGuards(AuthGuard('jwt'))
    async testDataSourceCredential(@Body() body: TestCredentialsQueryDto): Promise<TestDataSourceResponseDto> {
        return await this.service.testDataSourceCredential(body);
    }

    @Post('/connections/:dataSourceId/sync')
    @UseGuards(AuthGuard('jwt'))
    async syncDataSource(
        @Param('dataSourceId') dataSourceId: string,
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

    @Patch('internal/imports/initiate')
    async initiateImport(@Body() body: { dataSourceId: string }, @Req() req: Request): Promise<void> {
        await this.service.handleImportInitiated(body.dataSourceId, req.headers['api-key'] as string);
    }

    @Patch('internal/imports/completed')
    async completedImports(@Body() body: CompletedImportsRequestDto, @Req() req: Request): Promise<void> {
        await this.service.handleImportsCompleted(body, req.headers['api-key'] as string);
    }
}
