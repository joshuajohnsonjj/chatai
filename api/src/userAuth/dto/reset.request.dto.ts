import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class ResetRequestDto {
  @IsStrongPassword({
  	minLength: 8,
  	minLowercase: 1,
  	minNumbers: 1,
  	minUppercase: 1
  })
  	password: string;

  @IsEmail()
  	email: string;

  @IsString()
  	code: string;
}
