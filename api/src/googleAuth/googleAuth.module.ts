// src/auth/auth.module.ts
import { Logger, Module } from '@nestjs/common';
import { GoogleAuthController } from './googleAuth.controller';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';

@Module({
    imports: [PassportModule.register({ session: true })],
    providers: [GoogleStrategy, Logger],
    controllers: [GoogleAuthController],
})
export class GoogleAuthModule {}
