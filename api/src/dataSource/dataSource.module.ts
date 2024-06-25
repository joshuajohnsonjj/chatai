import { Module, Logger } from '@nestjs/common';
import { DataSourceService } from './dataSource.service';
import { DataSourceController } from './dataSource.controller';
import { MultiAuthGuard } from 'src/auth/multiAuth.guard';

@Module({
    imports: [],
    providers: [DataSourceService, Logger, MultiAuthGuard],
    exports: [DataSourceService],
    controllers: [DataSourceController],
})
export class DataSourceModule {}
