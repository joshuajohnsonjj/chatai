import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsStrongPassword, MaxLength, MinLength } from 'class-validator';

export class RegisterRequestDto {
    @IsString()
    @MaxLength(15)
    @MinLength(1)
    firstName: string;

    @IsString()
    @MaxLength(20)
    @MinLength(1)
    lastName: string;

    @IsPhoneNumber()
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
