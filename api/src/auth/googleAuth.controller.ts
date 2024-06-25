import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { BadRequestError } from 'src/exceptions';
import { GoogleAuthGuard } from './google.guard';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from './googleAuth.service';

@Controller('v1/auth/google')
export class GoogleAuthController {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: GoogleAuthService,
    ) {}

    @Get('/authorize/user')
    @UseGuards(
        new GoogleAuthGuard([
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ]),
    )
    async googleAuth() {}

    @Get('/authorize/gmail')
    @UseGuards(
        new GoogleAuthGuard([
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ]),
    )
    async googleGmailAuthorize() {}

    @Get('/authorize/drive')
    @UseGuards(
        new GoogleAuthGuard([
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ]),
    )
    async googleDriveAuthorize() {}

    @Get('/authorize/all')
    @UseGuards(
        new GoogleAuthGuard([
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ]),
    )
    async googleAuthorizeAll() {}

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
