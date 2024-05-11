import { IsBoolean, IsEnum, IsInt, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChatTone } from '@prisma/client';

export class GetChatResponseQueryDto {
    @IsUUID()
    userPromptMessageId: string;

    @IsString()
    userPromptText: string;

    @IsUUID()
    threadId: string;

    @IsBoolean()
    isReplyMessage: boolean;

    @IsUUID()
    systemResponseMessageId: string;

    @IsInt()
    creativitySetting: number;

    @IsInt()
    confidenceSetting: number;

    @IsEnum(ChatTone)
    toneSetting: ChatTone;

    @IsString()
    @IsOptional()
    baseInstructions: string;
}

export class ListChatMessagesQueryDto {
    @IsNumberString()
    @Transform(({ value }) => parseInt(value as string, 10))
    page: number;
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

export class ChatThreadResponseDto {
    threadId: string;
    messages: GetChatResponseResponseDto[];
}

export class ListChatMessagesResponseDto {
    page: number;
    size: number;
    threads: ChatThreadResponseDto[];
}
