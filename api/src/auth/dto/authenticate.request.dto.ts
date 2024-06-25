import { IsString } from 'class-validator';

export class AuthenticateRequestDto {
    @IsString()
    username: string;

    @IsString()
    password: string;
}
