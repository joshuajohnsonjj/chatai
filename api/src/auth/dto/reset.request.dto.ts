import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class ResetRequestDto {
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
    })
    password: string;

    @IsEmail()
    email: string;

    @IsString()
    code: string;
}

export class ChangeRequestDto {
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
    })
    oldPassword: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
    })
    newPassword: string;

    @IsString()
    accessToken: string;
}
