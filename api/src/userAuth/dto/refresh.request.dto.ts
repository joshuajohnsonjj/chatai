import { IsString } from 'class-validator';

export class RefreshUserSessionRequestDto {
    @IsString()
    username: string;

    @IsString()
    refreshToken: string;
}
