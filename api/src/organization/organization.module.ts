import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { AuthModule } from 'src/auth/auth.module';
import { DataSourceModule } from 'src/dataSource/dataSource.module';

@Module({
    imports: [AuthModule, DataSourceModule],
    providers: [OrganizationService],
    controllers: [OrganizationController],
})
export class OrganizationModule {}
