import { Module } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
import { DataSourceController } from './dataSource.controller';

@Module({
    imports: [],
    providers: [DataSourceService],
    controllers: [DataSourceController],
})
export class DataSourceModule {}
