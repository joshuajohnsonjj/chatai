import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_OAUTH_SECRET_KEY,
            callbackURL: process.env.GOOGLE_OAUTH_REDIRECT_URL,
            scope: [
                'https://www.googleapis.com/auth/drive.readonly',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/userinfo.profile',
            ],
        });
    }

    async validate(
        accessToken: string,
        _refreshToken: string,
        profile: { id: string },
        done: VerifyCallback,
    ): Promise<void> {
        const { id } = profile;
        const user = {
            userId: id,
            accessToken,
        };
        done(null, user);
    }
}
