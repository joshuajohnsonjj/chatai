import { Body, Controller, Get, Req, UseGuards, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';
import { Request } from 'express';
import {
    GetUserInfoRequestDto,
    GetUserInfoResponseDto,
    SetProfileImageRequestDto,
    UpdateUserInfoRequestDto,
    UpdateUserSettingsRequestDto,
} from './dto/userInfo.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
    constructor(private readonly service: UserService) {}

    @Get()
    async getUserInfo(@Body() payload: GetUserInfoRequestDto, @Req() req: Request): Promise<GetUserInfoResponseDto> {
        return await this.service.getUserInfo(payload, req.user as DecodedUserTokenDto);
    }

    @Patch()
    async updateUserData(
        @Body() payload: UpdateUserInfoRequestDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.updateUserData(payload, req.user as DecodedUserTokenDto);
        return { success: true };
    }

    @Post('/image')
    async uploadUserImage(
        @Body() payload: SetProfileImageRequestDto,
        @Req() req: Request,
    ): Promise<{ imageUrl: string }> {
        return await this.service.uploadUserImage(
            payload.imageBase64,
            payload.fileType,
            req.user as DecodedUserTokenDto,
        );
    }

    @Patch('/settings')
    async updateUserSettings(
        @Body() payload: UpdateUserSettingsRequestDto,
        @Req() req: Request,
    ): Promise<{ success: boolean }> {
        await this.service.updateUserSettings(payload, req.user as DecodedUserTokenDto);
        return { success: true };
    }
}
