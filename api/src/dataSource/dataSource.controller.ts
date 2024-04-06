import { BadRequestException, Controller, Body, Post } from '@nestjs/common';
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
	@Body() params: CreateDataSourceQueryDto,
	): Promise<CreateDataSourceResponseDto> {
		try {
			return await this.service.createDataSource(params);
		} catch (e) {
			throw new BadRequestException(e.message);
		}
	}

	@Post('test')
	async testDataSourceCredential(
	@Body() params: CreateDataSourceQueryDto,
	): Promise<TestDataSourceResponseDto> {
		try {
			return await this.service.testDataSourceCredential(params);
		} catch (e) {
			throw new BadRequestException(e.message);
		}
	}
}
