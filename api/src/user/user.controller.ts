import { Body, Controller, Get, UsePipes, ValidationPipe, Req, UseGuards, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { Request } from 'express';
import {
    GetUserInfoRequestDto,
    GetUserInfoResponseDto,
    SetProfileImageRequestDto,
    SetProfileImageResponseDto,
    UpdateUserInfoRequestDto,
    UpdateUserSettingsRequestDto,
} from './dto/userInfo.dto';
import { AuthGuard } from '@nestjs/passport';

// TODO: add validation pipe to everything??

@Controller('v1/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
    constructor(private readonly service: UserService) {}

    @Get()
    @UsePipes(ValidationPipe)
    async getUserInfo(@Body() payload: GetUserInfoRequestDto, @Req() req: Request): Promise<GetUserInfoResponseDto> {
        return await this.service.getUserInfo(payload, req.user as DecodedUserTokenDto);
    }

    @Patch()
    @UsePipes(ValidationPipe)
    async updateUserData(
        @Body() payload: UpdateUserInfoRequestDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.updateUserData(payload, req.user as DecodedUserTokenDto);
        return { success: true };
    }

    @Post('/image')
    @UsePipes(ValidationPipe)
    async uploadUserImage(
        @Body() payload: SetProfileImageRequestDto,
        @Req() req: Request,
    ): Promise<SetProfileImageResponseDto> {
        return await this.service.uploadUserImage(payload.imageBase64, req.user as DecodedUserTokenDto);
    }

    @Patch('/settings')
    @UsePipes(ValidationPipe)
    async updateUserSettings(
        @Body() payload: UpdateUserSettingsRequestDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.updateUserSettings(payload, req.user as DecodedUserTokenDto);
        return { success: true };
    }
}
