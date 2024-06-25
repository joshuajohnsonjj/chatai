import { IsString } from 'class-validator';

export class ConfirmUserRequestDto {
    @IsString()
    code: string;

    @IsString()
    username: string;
}
