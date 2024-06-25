// src/auth/auth.module.ts
import { Logger, Module } from '@nestjs/common';
import { GoogleAuthController } from './googleAuth.controller';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { GoogleAuthService } from './googleAuth.service';

@Module({
    imports: [PassportModule.register({ session: true })],
    providers: [GoogleAuthService, GoogleStrategy, Logger],
    controllers: [GoogleAuthController],
})
export class GoogleAuthModule {}
