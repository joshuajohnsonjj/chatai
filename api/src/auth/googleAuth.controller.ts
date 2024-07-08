import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { BadRequestError } from 'src/exceptions';
import { GoogleAuthGuard } from './google.guard';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from './googleAuth.service';
import { CAL_SCOPE, DRIVE_SCOPE, GMAIL_SCOPE, MEET_SCOPE, USER_PROFILE_SCOPES } from './google.scopes';
import { DataSourceTypeName } from '@prisma/client';

@Controller('v1/auth/google')
export class GoogleAuthController {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: GoogleAuthService,
    ) {}

    @Get('/authorize')
    async googleAuth(@Query('scopes') scopes: string) {
        const googleScopes = USER_PROFILE_SCOPES;

        scopes.split(',').forEach((scope) => {
            switch (scope) {
                case DataSourceTypeName.GMAIL:
                    googleScopes.push(GMAIL_SCOPE);
                    return;
                case DataSourceTypeName.GOOGLE_CALENDAR:
                    googleScopes.push(CAL_SCOPE);
                    return;
                case DataSourceTypeName.GOOGLE_DRIVE:
                    googleScopes.push(DRIVE_SCOPE);
                    return;
                case DataSourceTypeName.GOOGLE_MEET:
                    googleScopes.push(MEET_SCOPE);
                    return;
                default:
            }
        });

        return new GoogleAuthGuard(googleScopes);
    }

    @Get('callback')
    @UseGuards(new GoogleAuthGuard([]))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        await this.authService.handleGoogleCallback(req);

        const responseQuery = new URLSearchParams({
            a: req.user.accessToken,
            r: req.user.refreshToken,
            u: req.user.profile.sub,
            e: req.user.profile.email,
        });

        res.redirect(`${this.configService.get<string>('CLIENT_OAUTH_REDIRECT_URL')!}?${responseQuery.toString()}`);
    }

    @Get('refresh')
    async refreshAccessToken(@Query('r') refreshToken: string): Promise<{ accessToken: string }> {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token required');
        }

        const accessToken = await this.authService.handleGoogleRefreshAccessToken(refreshToken);

        return { accessToken };
    }
}
