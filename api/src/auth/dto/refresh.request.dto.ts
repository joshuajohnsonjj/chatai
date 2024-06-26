import { IsEmail, IsJWT } from 'class-validator';

export class RefreshUserSessionRequestDto {
    @IsEmail()
    username: string;

    @IsJWT()
    refreshToken: string;
}
