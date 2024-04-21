import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import { DynamoClient } from '@joshuajohnsonjj38/dynamo';
import type { GetChatResponseResponseDto, ListChatMessagesResponseDto } from './dto/message.dto';
import type { StartNewChatQueryDto, StartNewChatResponseDto, ListChatResponseDto } from './dto/chat.dto';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AccessDeniedError, ResourceNotFoundError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import { CognitoAttribute } from 'src/types';

@Injectable()
export class ChatService {
    private readonly qdrant = new QdrantWrapper(
        this.configService.get<string>('QDRANT_HOST')!,
        this.configService.get<string>('QDRANT_COLLECTION')!,
        this.configService.get<string>('QDRANT_KEY')!,
    );

    private readonly dynamdo = new DynamoClient(this.configService.get<string>('AWS_REGION')!);

    private readonly ai = new OpenAIWrapper(this.configService.get<string>('GEMINI_KEY')!);

    constructor(
        private readonly prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    async generateResponse(
        chatId: string,
        entityId: string,
        userPrompt: string,
        user: DecodedUserTokenDto,
    ): Promise<GetChatResponseResponseDto> {
        if (entityId !== user.idUser && entityId !== user[CognitoAttribute.ORG]) {
            throw new AccessDeniedError('User unauthorized to interact with this chat');
        }

        const questionVector = await this.ai.getTextEmbedding(userPrompt);
        const queryResult = await this.qdrant.query(questionVector, entityId);
        const matchedDataResult = await this.dynamdo.batchGetByIds(queryResult.map((res) => res.id));

        const matchedDataText = matchedDataResult.map((data) => data.text);
        const generatedResponse = await this.ai.getGptReponseFromSourceData(userPrompt, matchedDataText);

        const [, savedResponse] = await Promise.all([
            this.prisma.chatMessage.create({
                data: {
                    text: userPrompt,
                    isSystemMessage: false,
                    chatId,
                },
            }),
            this.prisma.chatMessage.create({
                data: {
                    text: generatedResponse,
                    chatId,
                    isSystemMessage: true,
                },
            }),
            this.prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            }),
        ]);

        return savedResponse;
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

    async listChatMessages(
        chatId: string,
        page: number,
        user: DecodedUserTokenDto,
    ): Promise<ListChatMessagesResponseDto> {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { associatedEntityId: true },
        });

        if (!chat) {
            throw new ResourceNotFoundError(chatId, 'Chat');
        }

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user[CognitoAttribute.ORG]) {
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

    async listChats(page: number, user: DecodedUserTokenDto): Promise<ListChatResponseDto> {
        const associatedEntityId = user[CognitoAttribute.ORG] ?? user.idUser;

        const pageSize = 20;
        const chatsQuery = await this.prisma.chat.findMany({
            where: {
                associatedEntityId,
                userId: user.idUser,
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: pageSize,
            skip: page * pageSize,
            select: {
                id: true,
                title: true,
                updatedAt: true,
                gptMessages: {
                    select: {
                        text: true,
                        isSystemMessage: true,
                        createdAt: true,
                    },
                    take: 1,
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        const chats = chatsQuery.map((chat) => ({
            id: chat.id,
            title: chat.title,
            lastMessage: {
                timestamp: chat.gptMessages[0]?.createdAt ?? chat.updatedAt,
                text: chat.gptMessages[0]?.text ?? '',
                isSystemMessage: !!chat.gptMessages[0]?.isSystemMessage,
            },
        }));

        return {
            page,
            size: pageSize,
            chats,
        };
    }
}
