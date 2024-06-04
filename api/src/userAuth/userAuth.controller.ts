import { Body, Controller, Param, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import type { AuthenticateRequestDto } from './dto/authenticate.request.dto';
import type { ConfirmUserRequestDto } from './dto/confirm.request.dto';
import type { ForgetRequestDto } from './dto/forget.request.dto';
import type { RefreshUserSessionRequestDto } from './dto/refresh.request.dto';
import type { RegisterRequestDto } from './dto/register.request.dto';
import type { ChangeRequestDto, ResetRequestDto } from './dto/reset.request.dto';
import type { AuthenticateResponseDto, RegisterResponseDto } from './dto/response.dto';
import { BadRequestError } from 'src/exceptions';

@Controller('v1/userAuth')
export class UserAuthController {
    constructor(private readonly authService: UserAuthService) {}

    // TODO: fix validation pipe for other routes.. not working bc auth guard??

    @Post('register')
    @UsePipes(ValidationPipe)
    async register(@Body() registerRequest: RegisterRequestDto): Promise<RegisterResponseDto> {
        try {
            return await this.authService.register(registerRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('invite/:invitationId/accept')
    async acceptInvite(
        @Param() invitationId: string,
        @Body() registerRequest: RegisterRequestDto,
    ): Promise<RegisterResponseDto> {
        try {
            return await this.authService.acceptInvite(invitationId, registerRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('login')
    async authenticate(@Body() authenticateRequest: AuthenticateRequestDto): Promise<AuthenticateResponseDto> {
        try {
            return await this.authService.authenticate(authenticateRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('/password/forgot')
    async forgot(@Body() forgetRequest: ForgetRequestDto) {
        try {
            return await this.authService.forget(forgetRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('/password/reset')
    async reset(@Body() resetRequest: ResetRequestDto) {
        try {
            return await this.authService.reset(resetRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('/password/change')
    async updatePassword(@Body() data: ChangeRequestDto) {
        try {
            return await this.authService.updatePassword(data.accessToken, data.oldPassword, data.newPassword);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('confirm')
    async confirm(@Body() confirmUserRequest: ConfirmUserRequestDto) {
        try {
            return await this.authService.confirmUser(confirmUserRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Patch('confirm')
    async resendConfirmEmail(@Body() params: ForgetRequestDto) {
        try {
            return await this.authService.resendConfirmEmail(params.email);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('refresh')
    async refreshSession(
        @Body() refreshSessionRequest: RefreshUserSessionRequestDto,
    ): Promise<AuthenticateResponseDto> {
        try {
            return await this.authService.refreshUserSession(refreshSessionRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }
}
