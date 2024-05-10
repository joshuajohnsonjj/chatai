import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';
import { ChatTone, ChatType } from '@prisma/client';

export class StartNewChatQueryDto {
    @IsUUID()
    userId: string;

    @IsUUID()
    associatedEntityId: string;

    @IsString()
    @MaxLength(40)
    @MinLength(1)
    title: string;

    @IsString()
    chatType: ChatType;
}

export class UpdateChatDetailRequestDto {
    @IsBoolean()
    @IsOptional()
    isArchived?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(40)
    @MinLength(1)
    title?: string;

    @IsInt()
    @Min(1)
    @Max(9)
    @IsOptional()
    chatCreativity?: number;

    @IsInt()
    @Min(1)
    @Max(9)
    @IsOptional()
    chatMinConfidence?: number;

    @IsEnum(ChatTone)
    @IsOptional()
    chatTone?: ChatTone;

    @IsString()
    @MaxLength(240)
    @IsOptional()
    baseInstructions?: string;
}

export class ListChatResponseDto {
    page: number;
    size: number;
    chats: ChatResponseDto[];
}

export class ChatResponseDto {
    id: string;
    title: string;
    chatType: ChatType;
    chatCreativity: number | null;
    chatMinConfidence: number | null;
    chatTone: ChatTone | null;
    baseInstructions: string | null;
    isArchived: boolean;
    lastMessage?: {
        timestamp: Date;
        text: string;
        isSystemMessage: boolean;
    };
}
