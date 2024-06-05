import { Controller, Get, Logger, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoggerContext } from 'src/constants';
import { OAuth2Client } from 'google-auth-library';
import { InternalError } from 'src/exceptions';

@Controller('v1/auth/google')
export class GoogleAuthController {
    private oauth2Client: OAuth2Client;

    constructor(
        private readonly logger: Logger,
        private readonly configService: ConfigService,
    ) {
        this.oauth2Client = new OAuth2Client(
            this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID')!,
            this.configService.get<string>('GOOGLE_OAUTH_SECRET_KEY')!,
            this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URL')!,
        );
    }

    @Get()
    @UseGuards(AuthGuard('google'))
    async googleAuth() {}

    @Get('callback')
    @UseGuards(AuthGuard('google'))
    googleAuthRedirect(@Req() req, @Res() res: Response) {
        this.logger.log(`Handling callback for google user ${req.user.profile.email}`, LoggerContext.GOOGLE_AUTH);

        res.redirect(
            `${this.configService.get<string>('CLIENT_OAUTH_REDIRECT_URL')!}?a=${req.user.accessToken}&r=${req.user.refreshToken}`,
        );
    }

    @Get('refresh')
    async refreshAccessToken(@Query('refreshToken') refreshToken: string): Promise<{ accessToken: string }> {
        try {
            this.logger.log('Attempting to refresh access token', LoggerContext.GOOGLE_AUTH);

            this.oauth2Client.setCredentials({ refresh_token: refreshToken });
            const response = await this.oauth2Client.refreshAccessToken();
            const { credentials } = response;
            const newAccessToken = credentials.access_token;

            if (!newAccessToken) {
                throw new InternalError('Accees token undefined');
            }

            return { accessToken: newAccessToken };
        } catch (error) {
            this.logger.error(
                'Error refreshing access token: ' + error.message,
                error.stack,
                LoggerContext.GOOGLE_AUTH,
            );
            throw new InternalError(error.message);
        }
    }
}
