import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsStrongPassword } from 'class-validator';

export class RegisterRequestDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsPhoneNumber('US')
    @IsOptional()
    phoneNumber?: string;

    @IsEmail()
    email: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
    })
    password: string;
}
