import { Body, Controller, Get, UsePipes, ValidationPipe, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { Request } from 'express';
import { GetUserInfoRequestDto } from './dto/userInfo.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
    constructor(private readonly Service: UserService) {}

    @Get()
    @UsePipes(ValidationPipe)
    async getUserInfo(@Body() payload: GetUserInfoRequestDto, @Req() req: Request) {
        return await this.Service.getUserInfo(payload, req.user as DecodedUserTokenDto);
    }
}
