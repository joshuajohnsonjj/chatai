import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetChatResponseQueryDto {
    @IsUUID()
    promptId: string;

    @IsString()
    text: string;

    @IsUUID()
    @IsOptional()
    replyThreadId?: string;
}

export class GetChatResponseResponseDto {
    id: string;
    text: string;
    isSystemMessage: boolean;
    chatId: string;
    threadId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class ListChatMessagesQueryDto {
    @IsNumberString()
    @Transform(({ value }) => parseInt(value as string, 10))
    page: number;
}

export class ChatThreadResponseDto {
    threadId: string;
    messages: GetChatResponseResponseDto[];
}

export class ListChatMessagesResponseDto {
    page: number;
    size: number;
    threads: ChatThreadResponseDto[];
}
