import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { LoggerContext } from 'src/constants';
import { AccessDeniedError, InternalError } from 'src/exceptions';

@Injectable()
export class GoogleAuthService {
    private readonly googleOAuthClient = new OAuth2Client(
        this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')!,
        this.configService.get<string>('GOOGLE_OAUTH_SECRET_KEY')!,
        this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URL')!,
    );

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}

    async handleGoogleCallback(req) {
        const reqState = JSON.parse(req.query.state ?? '{}');

        this.logger.log(`Redirecting with tokens for google user ${req.user.profile.email}`, LoggerContext.GOOGLE_AUTH);
    }

    async handleGoogleRefreshAccessToken(refreshToken: string): Promise<string> {
        try {
            this.logger.log('Attempting to refresh access token', LoggerContext.GOOGLE_AUTH);

            this.googleOAuthClient.setCredentials({ refresh_token: refreshToken });
            const response = await this.googleOAuthClient.refreshAccessToken();
            const { credentials } = response;
            const newAccessToken = credentials.access_token;

            if (!newAccessToken) {
                throw new InternalError('Accees token undefined');
            }

            return newAccessToken;
        } catch (error) {
            this.logger.error(
                'Error refreshing access token: ' + error.message,
                error.stack,
                LoggerContext.GOOGLE_AUTH,
            );
            throw new InternalError(error.message);
        }
    }

    async verifyGoogleToken(token: string): Promise<any> {
        try {
            const ticket = await this.googleOAuthClient.verifyIdToken({
                idToken: token,
                audience: this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')!,
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error();
            }

            return {
                userId: payload.sub,
                email: payload.email,
                displayName: payload.name,
            };
        } catch (error) {
            throw new AccessDeniedError('Invalid Google token');
        }
    }
}
