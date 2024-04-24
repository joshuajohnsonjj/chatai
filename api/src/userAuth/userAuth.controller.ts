import { Body, Controller, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserAuthService } from './userAuth.service';
import { AuthenticateRequestDto } from './dto/authenticate.request.dto';
import { ConfirmUserRequestDto } from './dto/confirm.request.dto';
import { ForgetRequestDto } from './dto/forget.request.dto';
import { RefreshUserSessionRequestDto } from './dto/refresh.request.dto';
import { RegisterRequestDto } from './dto/register.request.dto';
import { ResetRequestDto } from './dto/reset.request.dto';
import { BadRequestError } from 'src/exceptions';

@Controller('v1/userAuth')
export class UserAuthController {
    constructor(private readonly authService: UserAuthService) {}

    @Post('register')
    @UsePipes(ValidationPipe)
    async register(@Body() registerRequest: RegisterRequestDto) {
        try {
            return await this.authService.register(registerRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('invite/:invitationId/accept')
    async acceptInvite(@Param() invitationId: string, @Body() registerRequest: RegisterRequestDto) {
        try {
            return await this.authService.acceptInvite(invitationId, registerRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('login')
    async authenticate(@Body() authenticateRequest: AuthenticateRequestDto) {
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

    @Post('confirm')
    async confirm(@Body() confirmUserRequest: ConfirmUserRequestDto) {
        try {
            return await this.authService.confirmUser(confirmUserRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }

    @Post('refresh')
    async refreshSession(@Body() refreshSessionRequest: RefreshUserSessionRequestDto) {
        try {
            return await this.authService.refreshUserSession(refreshSessionRequest);
        } catch (e) {
            throw new BadRequestError(e.message);
        }
    }
}
