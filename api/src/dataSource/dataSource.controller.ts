import { Controller, Body, Post, Param } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
// import { AuthGuard } from '@nestjs/passport';
// import { UseGuards } from '@nestjs/common/decorators';
import { CreateDataSourceQueryDto, CreateDataSourceResponseDto, TestDataSourceResponseDto } from './dto/dataSource.dto';

@Controller('dataSource')
// @UseGuards(AuthGuard('jwt'))
export class DataSourceController {
	constructor(private readonly service: DataSourceService) {}

	@Post()
	async createDataSource(
	@Body() body: CreateDataSourceQueryDto,
	): Promise<CreateDataSourceResponseDto> {
		return await this.service.createDataSource(body);
	}

	@Post('test')
	async testDataSourceCredential(
	@Body() body: CreateDataSourceQueryDto,
	): Promise<TestDataSourceResponseDto> {
		return await this.service.testDataSourceCredential(body);
	}

	@Post('/:dataSourceId/sync')
	async syncDataSource(
	@Param() dataSourceId: string,
	): Promise<{ success: boolean }> {
		await this.service.syncDataSource(dataSourceId);
		return { success: true };
	}
}
