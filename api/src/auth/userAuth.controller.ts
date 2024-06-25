import { Body, Controller, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import type { AuthenticateRequestDto } from './dto/authenticate.request.dto';
import type { ConfirmUserRequestDto } from './dto/confirm.request.dto';
import type { ForgetRequestDto } from './dto/forget.request.dto';
import type { RefreshUserSessionRequestDto } from './dto/refresh.request.dto';
import type { RegisterRequestDto } from './dto/register.request.dto';
import type { ChangeRequestDto, ResetRequestDto } from './dto/reset.request.dto';
import type { AuthenticateResponseDto, RegisterResponseDto } from './dto/response.dto';

@Controller('v1/auth/user')
export class UserAuthController {
    constructor(private readonly authService: UserAuthService) {}

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
}
