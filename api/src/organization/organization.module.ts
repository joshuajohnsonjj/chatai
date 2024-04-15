import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { UserAuthService } from 'src/userAuth/userAuth.service';

@Module({
    imports: [UserAuthService],
    providers: [OrganizationService],
    controllers: [OrganizationController],
})
export class OrganizationModule {}
