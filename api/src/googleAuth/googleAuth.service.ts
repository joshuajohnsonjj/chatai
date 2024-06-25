import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerContext } from 'src/constants';
import { OAuth2Client } from 'google-auth-library';
import { AccessDeniedError, InternalError } from 'src/exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/services/stripe';
import { createUserAndDependencies } from 'src/services/user';

@Injectable()
export class GoogleAuthService {
    private oauth2Client: OAuth2Client;

    private readonly stripeService = new StripeService(this.configService.get<string>('STRIPE_KEY')!);

    constructor(
        private readonly logger: Logger,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.oauth2Client = new OAuth2Client(
            this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')!,
            this.configService.get<string>('GOOGLE_OAUTH_SECRET_KEY')!,
            this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URL')!,
        );
    }

    async handleCallback(req) {
        const reqState = JSON.parse(req.query.state ?? '{}');
        
        if ('signup' in reqState.reqQuery) {
            this.logger.log(`Handling signup for google user ${req.user.profile.email}`, LoggerContext.GOOGLE_AUTH);

            await createUserAndDependencies(
                req.user.profile.sub,
                req.user.profile.given_name,
                req.user.profile.family_name,
                req.user.profile.email,
                this.prisma,
                this.stripeService,
                req.user.profile.picture,
            );
        }
        
        this.logger.log(`Redirecting with tokens for google user ${req.user.profile.email}`, LoggerContext.GOOGLE_AUTH);
    }

    async handleRefreshAccessToken(refreshToken: string): Promise<string> {
        try {
            this.logger.log('Attempting to refresh access token', LoggerContext.GOOGLE_AUTH);

            this.oauth2Client.setCredentials({ refresh_token: refreshToken });
            const response = await this.oauth2Client.refreshAccessToken();
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
            const ticket = await this.oauth2Client.verifyIdToken({
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
