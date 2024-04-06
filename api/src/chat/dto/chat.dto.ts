import {
	IsEnum,
	IsString,
	IsUUID,
	MaxLength,
	MinLength
} from 'class-validator';
import { ChatType } from '@prisma/client';

export class StartNewChatQueryDto {
  @IsUUID()
  	userId: string;

  @IsString()
  @MaxLength(40)
  @MinLength(1)
  	title: string;

  @IsEnum(ChatType)
  	chatType: ChatType;
}

export class StartNewChatResponseDto {
	id: string;
	title: string;
	chatType: ChatType;
	createdAt: Date;
	updatedAt: Date;
}
