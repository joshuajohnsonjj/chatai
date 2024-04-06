import { UserType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, IsStrongPassword } from 'class-validator';

export class RegisterRequestDto {
  @IsString()
  	firstName: string;

  @IsString()
  @IsOptional()
  	lastName?: string;

  @IsPhoneNumber('US')
  @IsOptional()
  	phoneNumber?: string;

  @IsEmail()
  	email: string;

  @IsEnum(UserType)
  	type: UserType;

  @IsStrongPassword({
  	minLength: 8,
  	minLowercase: 1,
  	minNumbers: 1,
  	minUppercase: 1
  })
  	password: string;
}
