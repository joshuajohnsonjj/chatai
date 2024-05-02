import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '@joshuajohnsonjj38/openai';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import type { ChatThreadResponseDto, GetChatResponseResponseDto, ListChatMessagesResponseDto } from './dto/message.dto';
import type { StartNewChatQueryDto, StartNewChatResponseDto, ListChatResponseDto } from './dto/chat.dto';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AccessDeniedError, ResourceNotFoundError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import { CognitoAttribute } from 'src/types';
import { v4 } from 'uuid';
import { last } from 'lodash';
import * as moment from 'moment';

@Injectable()
export class ChatService {
    private readonly ai = new GeminiService(this.configService.get<string>('GEMINI_KEY')!);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly logger: Logger,

        @Inject('MONGO_DB_CONNECTION')
        private readonly mongo: MongoDBService,
    ) {}

    async generateResponse(
        id: string,
        chatId: string,
        userPrompt: string,
        user: DecodedUserTokenDto,
        replyThreadId?: string,
    ): Promise<GetChatResponseResponseDto> {
        const chat = await this.prisma.chat.findUniqueOrThrow({
            where: { id: chatId },
            select: { associatedEntityId: true },
        });

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user[CognitoAttribute.ORG]) {
            this.logger.warn(`Blocked user ${user.idUser} from interacting with chat ${chatId}`);
            throw new AccessDeniedError('User unauthorized to interact with this chat');
        }

        this.logger.log(`Generating gpt response for chat ${chatId}`);

        const threadId = replyThreadId ?? v4();

        const userPromptEmbedding = await this.ai.getTextEmbedding(userPrompt);
        const matchedDataResult = await this.mongo.queryDataElementsByVector({
            vectorizedQuery: userPromptEmbedding,
            entityId: chat.associatedEntityId,
        });

        const matchedDataText = matchedDataResult.map((data) => data.text ?? '');
        const generatedResponse = await this.ai.getGptReponseFromSourceData(userPrompt, matchedDataText);

        // TODO: we can potentiall do more here with the data we have (i.e. confiedence, cite links, who said it, etc..)

        const [, savedResponse] = await Promise.all([
            this.prisma.chatMessage.create({
                data: {
                    id,
                    text: userPrompt,
                    isSystemMessage: false,
                    chatId,
                    threadId,
                    // in order to ensure proper ordering on the FE move createdAt slightly back
                    createdAt: moment().subtract(0.01, 'seconds').toDate(),
                },
            }),
            this.prisma.chatMessage.create({
                data: {
                    text: generatedResponse,
                    chatId,
                    isSystemMessage: true,
                    threadId,
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
                createdAt: 'asc',
            },
            take: pageSize,
            skip: page * pageSize,
        });

        const threads: ChatThreadResponseDto[] = [];
        messages.forEach((message) => {
            if (last(threads)?.threadId !== message.threadId) {
                threads.push({
                    threadId: message.threadId,
                    messages: [message],
                });
            } else {
                last(threads)!.messages.push(message);
            }
        });

        return {
            page,
            size: messages.length,
            threads,
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
            size: chats.length,
            chats,
        };
    }
}
