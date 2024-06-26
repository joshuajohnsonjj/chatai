import { IsEmail, IsString } from 'class-validator';

export class AuthenticateRequestDto {
    @IsEmail()
    username: string;

    @IsString()
    password: string;
}
