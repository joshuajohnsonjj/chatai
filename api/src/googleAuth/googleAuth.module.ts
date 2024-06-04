// src/auth/auth.module.ts
import { Logger, Module } from '@nestjs/common';
import { GoogleAuthService } from './googleAuth.service';
import { GoogleAuthController } from './googleAuth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';

@Module({
    imports: [
        PassportModule.register({ session: true }),
        JwtModule.register({
            secret: 'uTBh4zwlrqYmlEK4hiuE',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [GoogleAuthService, GoogleStrategy, Logger],
    controllers: [GoogleAuthController],
})
export class GoogleAuthModule {}
