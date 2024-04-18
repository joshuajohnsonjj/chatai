import { IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ChatType } from '@prisma/client';

export class StartNewChatQueryDto {
    @IsUUID()
    userId: string;

    @IsUUID()
    associatedEntityId: string;

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

export class ListChatResponseDto {
    page: number;
    size: number;
    chats: ChatResponseDto[];
}

export class ChatResponseDto {
    id: string;
    title: string;
    lastMessage: {
        timestamp: Date;
        text: string;
        isSystemMessage: boolean;
    };
}
