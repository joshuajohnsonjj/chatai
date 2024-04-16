import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import type { GetChatResponseResponseDto, ListChatResponseDto } from './dto/message.dto';
import type { StartNewChatQueryDto, StartNewChatResponseDto } from './dto/chat.dto';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AccessDeniedError, ResourceNotFoundError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async generateResponse(
        chatId: string,
        entityId: string,
        text: string,
        user: DecodedUserTokenDto,
    ): Promise<GetChatResponseResponseDto> {
        if (entityId !== user.idUser && entityId !== user.organization) {
            throw new AccessDeniedError('User unauthorized to interact with this chat');
        }

        // TODO: this may not be neccessary
        return await this.prisma.$transaction(async (tx) => {
            await tx.chatMessage.create({
                data: {
                    text,
                    isSystemMessage: false,
                    chatId,
                },
            });

            const openai = new OpenAIWrapper(this.configService.get<string>('OPENAI_SECRET')!);

            const questionVector = await openai.getTextEmbedding(text);
            const queryResult = await new QdrantWrapper(
                this.configService.get<string>('QDRANT_URL')!,
                this.configService.get<number>('QDRANT_PORT')!,
                this.configService.get<string>('QDRANT_COLLECTION')!,
            ).query(questionVector, entityId);

            const generatedResponse = await openai.getGptReponseFromSourceData(text, queryResult);

            const savedResponse = await tx.chatMessage.create({
                data: {
                    text: generatedResponse,
                    chatId,
                    isSystemMessage: true,
                },
            });

            return savedResponse;
        });
    }

    async startNewChat(params: StartNewChatQueryDto): Promise<StartNewChatResponseDto> {
        return await this.prisma.chat.create({
            data: {
                userId: params.userId,
                title: params.title,
                chatType: params.chatType,
                associatedEntityId: params.associatedEntityId,
            },
        });
    }

    async listChat(chatId: string, page: number, user: DecodedUserTokenDto): Promise<ListChatResponseDto> {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { associatedEntityId: true },
        });

        if (!chat) {
            throw new ResourceNotFoundError(chatId, 'Chat');
        }

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user.organization) {
            throw new AccessDeniedError('User unauthorized to read this data');
        }

        const pageSize = 20;
        const messages = await this.prisma.chatMessage.findMany({
            where: {
                chatId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: pageSize,
            skip: page * pageSize,
        });

        return {
            page,
            size: pageSize,
            messages,
        };
    }
}
