import { IsEmail, IsString } from 'class-validator';

export class RefreshUserSessionRequestDto {
    @IsEmail()
    username: string;

    @IsString()
    refreshToken: string;
}
