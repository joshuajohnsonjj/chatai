import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { UserAuthModule } from 'src/userAuth/userAuth.module';

@Module({
    imports: [UserAuthModule],
    providers: [OrganizationService],
    controllers: [OrganizationController],
})
export class OrganizationModule {}
