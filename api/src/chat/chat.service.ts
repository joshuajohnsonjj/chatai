import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type GeminiContentStream, GeminiService, type ChatHistory, type ChatTone } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import type {
    GetChatResponseQueryDto,
    GetChatResponseResponseDto,
    ListChatMessagesResponseDto,
} from './dto/message.dto';
import type {
    StartNewChatQueryDto,
    ListChatResponseDto,
    UpdateChatDetailRequestDto,
    ChatResponseDto,
} from './dto/chat.dto';
import { type DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AccessDeniedError, InternalError, ResourceNotFoundError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import { omit, reverse } from 'lodash';
import * as moment from 'moment';
import { PrismaError } from 'src/types';
import { ChatMessage } from '@prisma/client';

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
        chatId: string,
        params: GetChatResponseQueryDto,
        user: DecodedUserTokenDto,
    ): Promise<GeminiContentStream> {
        this.logger.log(`Start generate response for chat ${chatId}`, 'Chat');

        const chat = await this.prisma.chat.findUniqueOrThrow({
            where: { id: chatId },
            select: { associatedEntityId: true },
        });

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user.organization) {
            this.logger.error(`Blocked user ${user.idUser} from interacting with chat ${chatId}`, undefined, 'Chat');
            throw new AccessDeniedError('User unauthorized to interact with this chat');
        }

        this.logger.log(`Embedding prompt: ${params.userPromptText}`, 'Chat');
        const userPromptEmbedding = await this.ai.getTextEmbedding(params.userPromptText);
        const matchedDataResult = await this.mongo.queryDataElementsByVector(
            {
                vectorizedQuery: userPromptEmbedding,
                entityId: chat.associatedEntityId,
            },
            4,
        );

        // convert confidence from 1-9 to 0-1
        // const normalizedMinConfidence = (params.confidenceSetting - 1) / 8;
        // console.log(matchedDataResult)
        const matchedDataText = matchedDataResult.map((data) => data.text ?? '').join('. ');
        // .filter((data) => data.score >= normalizedMinConfidence)

        let chatHistory: ChatHistory[] | undefined;
        if (params.isReplyMessage) {
            this.logger.log(`Retrieving thread ${params.threadId} history for response continuation`, 'Chat');

            const queryRes = await this.prisma.chatMessage.findMany({
                where: { chatId, threadId: params.threadId },
                orderBy: { createdAt: 'asc' },
            });

            chatHistory = queryRes.map((message) => ({
                role: message.isSystemMessage ? 'model' : 'user',
                parts: [{ text: message.text }],
            }));
        }

        this.logger.log(`Start chat response for chat ${chatId}`, 'Chat');
        return this.ai.getGptReponseFromSourceData(
            params.userPromptText,
            matchedDataText,
            {
                creativitySetting: params.creativitySetting,
                baseInstructions: params.baseInstructions,
                toneSetting: params.toneSetting as ChatTone,
            },
            chatHistory,
        );
    }

    async handleChatResponseCompletion(
        userPromptMessageId: string,
        userPrompt: string,
        generatedResponse: string,
        chatId: string,
        threadId: string,
        isReply: boolean,
        systemResponseMessageId: string,
    ): Promise<GetChatResponseResponseDto> {
        this.logger.log(`Chat generation complete. Writing thread ${threadId} data to db.`, 'Chat');

        if (!isReply) {
            await this.prisma.chatMessageThread.create({
                data: {
                    chatId,
                    id: threadId,
                },
            });
        }

        // // TODO: we can potentiall do more here with the data we have (i.e. confiedence, cite links, who said it, etc..)
        const [, savedResponse] = await Promise.all([
            this.prisma.chatMessage.create({
                data: {
                    id: userPromptMessageId,
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
                    id: systemResponseMessageId,
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

    async startNewChat(params: StartNewChatQueryDto, user: DecodedUserTokenDto): Promise<ChatResponseDto> {
        if (user.idUser !== params.associatedEntityId && user.organization !== params.associatedEntityId) {
            throw new AccessDeniedError('User does not have access to perform this action');
        }

        return await this.prisma.chat.create({
            data: {
                userId: params.userId,
                title: params.title,
                chatType: params.chatType,
                associatedEntityId: params.associatedEntityId,
            },
        });
    }

    async updateChatDetail(
        chatId: string,
        updates: UpdateChatDetailRequestDto,
        user: DecodedUserTokenDto,
    ): Promise<ChatResponseDto> {
        this.logger.log(`Patching updates ${JSON.stringify(updates)} to chat ${chatId}`);

        try {
            return await this.prisma.chat.update({
                where: {
                    id: chatId,
                    userId: user.idUser,
                },
                data: {
                    ...updates,
                    updatedAt: new Date(),
                },
            });
        } catch (e) {
            if (e.code === PrismaError.RECORD_DOES_NOT_EXIST) {
                throw new AccessDeniedError('User does not have access to this chat');
            }
            throw new InternalError();
        }
    }

    async listChatMessages(
        chatId: string,
        page: number,
        user: DecodedUserTokenDto,
    ): Promise<ListChatMessagesResponseDto> {
        const pageSize = 20;

        // Retrieves 20 threads with oldest 2 messages per thread as well
        // as message count per thread. If message count is greater than 2,
        // we'll later grab the last 2 messages to include in the thread
        // messages array
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                threads: {
                    take: pageSize,
                    skip: page * pageSize,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        messages: {
                            orderBy: {
                                createdAt: 'asc',
                            },
                            take: 2,
                        },
                        _count: {
                            select: { messages: true },
                        },
                    },
                },
            },
        });

        if (!chat) {
            this.logger.error(`Chat ${chatId} does not exist`, undefined, 'Chat');
            throw new ResourceNotFoundError(chatId, 'Chat');
        }

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user.organization) {
            this.logger.error(`Blocked user ${user.idUser} from interacting with chat ${chatId}`, undefined, 'Chat');
            throw new AccessDeniedError('User unauthorized to read this data');
        }

        const extraThreadMessages: { [threadId: string]: ChatMessage[] } = Object.fromEntries(
            await Promise.all(
                chat.threads.map(async (thread) => {
                    if (thread._count.messages > 2) {
                        const messages = await this.prisma.chatMessage.findMany({
                            where: { threadId: thread.id },
                            orderBy: { createdAt: 'asc' },
                            take: -2,
                        });
                        return [thread.id, messages];
                    }
                    return [thread.id, []];
                }),
            ),
        );

        const threads = chat.threads.map((thread) => ({
            threadId: thread.id,
            totalMessageCount: thread._count.messages,
            timestamp: thread.createdAt,
            messages: [...thread.messages, ...extraThreadMessages[thread.id]],
        }));

        return {
            page,
            pageSize,
            responseSize: threads.length,
            threads: reverse(threads),
        };
    }

    async listChats(page: number, user: DecodedUserTokenDto): Promise<ListChatResponseDto> {
        const associatedEntityId = user.organization || user.idUser;

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
                chatCreativity: true,
                chatMinConfidence: true,
                chatTone: true,
                baseInstructions: true,
                isArchived: true,
                updatedAt: true,
                chatType: true,
                messages: {
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
            ...omit(chat, ['updatedAt', 'messages']),
            lastMessage: {
                timestamp: chat.messages[0]?.createdAt ?? chat.updatedAt,
                text: chat.messages[0]?.text ?? '',
                isSystemMessage: !!chat.messages[0]?.isSystemMessage,
            },
        }));

        return {
            page,
            size: chats.length,
            chats,
        };
    }
}
