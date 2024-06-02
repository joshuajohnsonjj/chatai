import { Logger, Module } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import { UserAuthController } from './userAuth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
    providers: [UserAuthService, JwtStrategy, Logger],
    exports: [UserAuthService],
    controllers: [UserAuthController],
})
export class UserAuthModule {}
