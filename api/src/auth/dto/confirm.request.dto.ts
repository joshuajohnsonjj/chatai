import { IsEmail, IsString } from 'class-validator';

export class ConfirmUserRequestDto {
    @IsString()
    code: string;

    @IsEmail()
    username: string;
}
