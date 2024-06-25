import { Logger, Module } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import { UserAuthController } from './userAuth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from 'src/auth/google.strategy';
import { GoogleAuthController } from 'src/auth/googleAuth.controller';
import { GoogleAuthService } from './googleAuth.service';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
    providers: [UserAuthService, GoogleAuthService, JwtStrategy, Logger, GoogleStrategy],
    exports: [UserAuthService],
    controllers: [UserAuthController, GoogleAuthController],
})
export class AuthModule {}
