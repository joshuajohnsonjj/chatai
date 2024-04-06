import { IsEmail } from 'class-validator';

export class ForgetRequestDto {
  @IsEmail()
  	email: string;
}
