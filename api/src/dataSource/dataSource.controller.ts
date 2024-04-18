import { Controller, Body, Post, Param, Req } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common/decorators';
import { CreateDataSourceQueryDto, CreateDataSourceResponseDto, TestDataSourceResponseDto } from './dto/dataSource.dto';
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

    @Post('test')
    async testDataSourceCredential(@Body() body: CreateDataSourceQueryDto, @Req() req: Request): Promise<TestDataSourceResponseDto> {
        return await this.service.testDataSourceCredential(body, req.user as DecodedUserTokenDto);
    }

    @Post('/:dataSourceId/sync')
    async syncDataSource(@Param() dataSourceId: string): Promise<{ success: boolean }> {
        await this.service.syncDataSource(dataSourceId);
        return { success: true };
    }
}
