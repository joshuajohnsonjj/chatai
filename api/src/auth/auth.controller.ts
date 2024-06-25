import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthenticateRequestDto } from './dto/authenticate.request.dto';
import type { ConfirmUserRequestDto } from './dto/confirm.request.dto';
import type { ForgetRequestDto } from './dto/forget.request.dto';
import type { RefreshUserSessionRequestDto } from './dto/refresh.request.dto';
import type { RegisterRequestDto } from './dto/register.request.dto';
import type { ChangeRequestDto, ResetRequestDto } from './dto/reset.request.dto';
import type { AuthenticateResponseDto, RegisterResponseDto } from './dto/response.dto';
import { GoogleAuthGuard } from './google.middleware';
import { BadRequestError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Controller('v1/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    // TODO: fix validation pipe for other routes.. not working bc auth guard??

    @Post('register')
    @UsePipes(ValidationPipe)
    async register(@Body() registerRequest: RegisterRequestDto): Promise<RegisterResponseDto> {
        return await this.authService.register(registerRequest);
    }

    @Post('invite/:invitationId/accept')
    async acceptInvite(
        @Param() invitationId: string,
        @Body() registerRequest: RegisterRequestDto,
    ): Promise<RegisterResponseDto> {
        return await this.authService.acceptInvite(invitationId, registerRequest);
    }

    @Post('login')
    async authenticate(@Body() authenticateRequest: AuthenticateRequestDto): Promise<AuthenticateResponseDto> {
        return await this.authService.authenticate(authenticateRequest);
    }

    @Post('/password/forgot')
    async forgot(@Body() forgetRequest: ForgetRequestDto) {
        return await this.authService.forget(forgetRequest);
    }

    @Post('/password/reset')
    async reset(@Body() resetRequest: ResetRequestDto) {
        return await this.authService.reset(resetRequest);
    }

    @Post('/password/change')
    async updatePassword(@Body() data: ChangeRequestDto) {
        return await this.authService.updatePassword(data.accessToken, data.oldPassword, data.newPassword);
    }

    @Post('confirm')
    async confirm(@Body() confirmUserRequest: ConfirmUserRequestDto) {
        return await this.authService.confirmUser(confirmUserRequest);
    }

    @Patch('confirm')
    async resendConfirmEmail(@Body() params: ForgetRequestDto) {
        return await this.authService.resendConfirmEmail(params.email);
    }

    @Post('refresh')
    async refreshSession(
        @Body() refreshSessionRequest: RefreshUserSessionRequestDto,
    ): Promise<AuthenticateResponseDto> {
        return await this.authService.refreshUserSession(refreshSessionRequest);
    }

    @Get('google/authorize/user')
    @UseGuards(new GoogleAuthGuard([
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ]))
    async googleAuth() { }
    
    @Get('google/authorize/gmail')
    @UseGuards(new GoogleAuthGuard([
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ]))
    async googleGmailAuthorize() { }
    
    @Get('google/authorize/drive')
    @UseGuards(new GoogleAuthGuard([
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ]))
    async googleDriveAuthorize() { }
    
    @Get('google/authorize/all')
    @UseGuards(new GoogleAuthGuard([
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ]))
    async googleAuthorizeAll() {}

    @Get('google/callback')
    @UseGuards(new GoogleAuthGuard([]))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        await this.authService.handleGoogleCallback(req);

        const responseQuery = new URLSearchParams({
            a: req.user.accessToken,
            r: req.user.refreshToken,
            u: req.user.profile.sub,
            e: req.user.profile.email,
        });

        res.redirect(
            `${this.configService.get<string>('CLIENT_OAUTH_REDIRECT_URL')!}?${responseQuery.toString()}`,
        );
    }

    @Get('googlerefresh')
    async refreshGoogleAccessToken(@Query('r') refreshToken: string): Promise<{ accessToken: string }> {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token required');
        }

        const accessToken = await this.authService.handleGoogleRefreshAccessToken(refreshToken);

        return { accessToken };
    }
}
