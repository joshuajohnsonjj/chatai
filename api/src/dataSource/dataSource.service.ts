import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDataSourceResponseDto, CreateDataSourceQueryDto, TestDataSourceResponseDto } from './dto/dataSource.dto';
// import { decrypt } from 'src/services/secretMananger';
import { DataSourceTypeName } from '@prisma/client';
import { testNotionConnection, testSlackConnection } from 'src/services/dataSources';

@Injectable()
export class DataSourceService {
	constructor (private readonly prisma: PrismaService) {}

	async createDataSource(params: CreateDataSourceQueryDto): Promise<CreateDataSourceResponseDto> {
		const isValid = await this.testDataSourceConnection(params.dataSourceTypeId, params.secret);

		if (!isValid) {
			throw 'Connection attempt failed.';
		}

		return this.prisma.dataSource.create({
			data: {
				dataSourceTypeId: params.dataSourceTypeId,
				ownerEntityId: params.ownerEntityId,
				ownerEntityType: params.ownerEntityType,
				secret: params.secret,
			},
			select: {
				id: true,
				createdAt: true,
				updatedAt: true,
				lastSync: true,
				dataSourceTypeId: true,
				ownerEntityId: true,
			}
		});
	}

	async testDataSourceCredential(params: CreateDataSourceQueryDto): Promise<TestDataSourceResponseDto> {
		const isValid = await this.testDataSourceConnection(params.dataSourceTypeId, params.secret);
		return { isValid };
	}

	private async testDataSourceConnection(dataSourceTypeId: string, secret: string): Promise<boolean> {
		const decryptedSecret = secret; //decrypt(secret);
		const dataSourceType = await this.prisma.dataSourceType.findUnique({
			where: {
				id: dataSourceTypeId,
			},
			select: {
				name: true,
			},
		});

		switch (dataSourceType?.name) {
		case DataSourceTypeName.NOTION:
			return testNotionConnection(decryptedSecret);
		case DataSourceTypeName.SLACK:
			return testSlackConnection(decryptedSecret);
		default:
			return false;
		}
	}
}
