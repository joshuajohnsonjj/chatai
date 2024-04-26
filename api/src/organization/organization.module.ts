import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { UserAuthModule } from 'src/userAuth/userAuth.module';
import { DataSourceModule } from 'src/dataSource/dataSource.module';

@Module({
    imports: [UserAuthModule, DataSourceModule],
    providers: [OrganizationService],
    controllers: [OrganizationController],
})
export class OrganizationModule {}
