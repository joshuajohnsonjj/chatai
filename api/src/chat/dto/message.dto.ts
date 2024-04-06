import {
	IsNumberString,
	IsString
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetChatResponseQueryDto {
  @IsString()
  	text: string;

  @IsString()
  	entityId: string;
}

export class GetChatResponseResponseDto {
	id: string;
	text: string;
	isSystemMessage: boolean;
	chatId: string;
	createdAt: Date;
	updatedAt: Date;
}

export class ListChatQueryDto {
  @IsNumberString()
  @Transform(({ value }) => parseInt(value as string, 10))
  	page: number;
}

export class ListChatResponseDto {
	page: number;
	size: number;
	messages: GetChatResponseResponseDto[];
}
