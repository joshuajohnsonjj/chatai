import { Module } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import { UserAuthController } from './userAuth.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
	imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
	providers: [UserAuthService],
	controllers: [UserAuthController]
})
export class UserAuthModule {}
