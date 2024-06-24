import {
    IsBoolean,
    IsBooleanString,
    IsEnum,
    IsInt,
    IsNumberString,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ChatTone } from '@prisma/client';

export class GetChatResponseQueryDto {
    @IsUUID()
    userPromptMessageId: string;

    @IsString()
    @MaxLength(2500)
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

    @IsString()
    getArchived: string;
}

export class ChatMessageInformerDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    messageId: string;
    name: string;
    url: string;
    sourceName: string;
    confidence: number;
}

export class GetChatResponseResponseDto {
    id: string;
    text: string;
    isSystemMessage: boolean;
    chatId: string;
    threadId: string;
    createdAt: Date;
    updatedAt: Date;
    informers?: ChatMessageInformerDto[];
}

export class ChatThreadResponseDto {
    threadId: string;
    totalMessageCount: number;
    timestamp: Date;
    messages: GetChatResponseResponseDto[];
}

export class ListChatMessagesResponseDto {
    page: number;
    pageSize: number;
    responseSize: number;
    threads: ChatThreadResponseDto[];
}
