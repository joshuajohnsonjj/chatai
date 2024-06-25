import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService, type MongoDataElementCollectionDoc } from '@joshuajohnsonjj38/mongodb';
import type {
    ChatThreadResponseDto,
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
import { type DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';
import { AccessDeniedError, InternalError, ResourceNotFoundError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import { omit } from 'lodash';
import * as moment from 'moment';
import { PrismaError } from 'src/types';
import { ChatMessage } from '@prisma/client';
import { type OpenAIMessageHistory, OpenAIService } from 'src/services/openai';
import { LoggerContext } from 'src/constants';

@Injectable()
export class ChatService {
    private readonly gemini = new GeminiService(this.configService.get<string>('GEMINI_KEY')!);

    private readonly openai = new OpenAIService(this.configService.get<string>('OPENAI_KEY')!);

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
        editingMessageId?: string,
    ) {
        this.logger.log(`Start generate response for chat ${chatId}`, LoggerContext.CHAT);

        const chat = await this.prisma.chat.findUniqueOrThrow({
            where: { id: chatId },
            select: { associatedEntityId: true },
        });

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user.organization) {
            this.logger.error(
                `Blocked user ${user.idUser} from interacting with chat ${chatId}`,
                undefined,
                LoggerContext.CHAT,
            );
            throw new AccessDeniedError('User unauthorized to interact with this chat');
        }

        this.logger.log(`Embedding prompt: ${params.userPromptText}`, LoggerContext.CHAT);
        const userPromptEmbedding = await this.gemini.getTextEmbedding(params.userPromptText);
        const matchedDataResult = await this.mongo.queryDataElementsByVector(
            {
                vectorizedQuery: userPromptEmbedding,
                entityId: chat.associatedEntityId,
            },
            4,
        );

        // TODO: adjust confidence values so they're acturally useful...
        // convert confidence from 1-9 to 0-1
        // const normalizedMinConfidence = (params.confidenceSetting - 1) / 8;
        const matchedDataText = matchedDataResult
            // .filter((data) => data.score >= normalizedMinConfidence)
            .map((data) => data.text ?? '')
            .join('. ');

        const chatHistory = await this.getThreadHistory(
            params.isReplyMessage,
            params.threadId,
            chatId,
            editingMessageId,
        );

        const chatSettings = {
            chatCreativity: params.creativitySetting,
            baseInstructions: params.baseInstructions,
            chatTone: params.toneSetting,
        };

        this.logger.log(
            `Start chat response for chat ${chatId} with settings ${JSON.stringify(chatSettings)}`,
            LoggerContext.CHAT,
        );

        const stream = await this.openai.getGptReponseStreamWithSourceData(
            user.idUser,
            params.userPromptText,
            matchedDataText,
            chatSettings,
            chatHistory,
        );

        return { stream, matchedDataResult };
    }

    async handleChatResponseCompletion(
        userPromptMessageId: string,
        userPrompt: string,
        generatedResponse: string,
        chatId: string,
        threadId: string,
        isReply: boolean,
        systemResponseMessageId: string,
        matchedInformers: (MongoDataElementCollectionDoc & { score: number })[],
    ): Promise<GetChatResponseResponseDto> {
        this.logger.log(`Chat generation complete. Writing thread ${threadId} data to db.`, LoggerContext.CHAT);

        if (!isReply) {
            await this.prisma.chatMessageThread.create({
                data: {
                    chatId,
                    id: threadId,
                },
            });
        }

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

        await this.prisma.chatMessageInformer.createMany({
            data: matchedInformers.map((match) => ({
                messageId: systemResponseMessageId,
                name: match.title,
                url: match.url ?? '',
                sourceName: match.dataSourceType,
                confidence: match.score,
            })),
        });

        return savedResponse;
    }

    async handleUpdatedChatResponseCompletion(
        userPromptMessageId: string,
        userPrompt: string,
        generatedResponse: string,
        chatId: string,
        threadId: string,
        systemResponseMessageId: string,
        matchedInformers: (MongoDataElementCollectionDoc & { score: number })[],
    ): Promise<GetChatResponseResponseDto> {
        this.logger.log(
            `Chat message update generation complete. Updating thread ${threadId} data.`,
            LoggerContext.CHAT,
        );

        const [savedResponse] = await Promise.all([
            this.prisma.chatMessage.update({
                where: { id: systemResponseMessageId },
                data: {
                    text: generatedResponse,
                    updatedAt: new Date(),
                },
            }),
            this.prisma.chatMessage.update({
                where: { id: userPromptMessageId },
                data: {
                    text: userPrompt,
                    updatedAt: new Date(),
                },
            }),
            this.prisma.chatMessageInformer.deleteMany({
                where: { messageId: systemResponseMessageId },
            }),
            this.prisma.chat.update({
                where: { id: chatId },
                data: { updatedAt: new Date() },
            }),
        ]);

        await this.prisma.chatMessageInformer.createMany({
            data: matchedInformers.map((match) => ({
                messageId: systemResponseMessageId,
                name: match.title,
                url: match.url ?? '',
                sourceName: match.dataSourceType,
                confidence: match.score,
            })),
        });

        return savedResponse;
    }

    async startNewChat(params: StartNewChatQueryDto, user: DecodedUserTokenDto): Promise<ChatResponseDto> {
        if (user.idUser !== params.associatedEntityId && user.organization !== params.associatedEntityId) {
            this.logger.error(
                `Blocked user ${user.idUser} from starting chat in entity ${params.associatedEntityId}`,
                undefined,
                LoggerContext.CHAT,
            );
            throw new AccessDeniedError('User does not have access to perform this action');
        }

        this.logger.log(`Creating chat ${params.title} for user ${user.idUser}`, LoggerContext.CHAT);

        let title = params.title;
        const defaultTitle = 'My new chat #';
        if (!title) {
            const untitledChatCount = await this.prisma.chat.count({
                where: {
                    userId: user.idUser,
                    title: { startsWith: defaultTitle },
                },
            });

            title = `${defaultTitle}${untitledChatCount + 1}`;
        }

        return await this.prisma.chat.create({
            data: {
                userId: user.idUser,
                title,
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
        this.logger.log(`Patching updates ${JSON.stringify(updates)} to chat ${chatId}`, LoggerContext.CHAT);

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
                this.logger.error(
                    `Chat ${chatId} does not exist or user ${user.idUser} does not have access`,
                    undefined,
                    LoggerContext.CHAT,
                );
                throw new AccessDeniedError('User does not have access to this chat');
            }

            this.logger.error(e.message, e.stack, LoggerContext.CHAT);
            throw new InternalError();
        }
    }

    async listChatMessages(
        chatId: string,
        page: number,
        user: DecodedUserTokenDto,
    ): Promise<ListChatMessagesResponseDto> {
        this.logger.log(`Listing message page ${page} for chat ${chatId}`, LoggerContext.CHAT);

        const pageSize = 20;

        // Retrieves 20 threads with oldest 2 messages per thread as well
        // as message count per thread. If message count is greater than 2,
        // we'll later grab the newest 2 messages to include in the thread
        // messages array
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                threads: {
                    take: pageSize,
                    skip: page * pageSize,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        messages: {
                            take: 2,
                            orderBy: { createdAt: 'asc' },
                            include: { informers: true },
                        },
                        _count: { select: { messages: true } },
                    },
                },
            },
        });

        if (!chat) {
            this.logger.error(`Chat ${chatId} does not exist`, undefined, LoggerContext.CHAT);
            throw new ResourceNotFoundError(chatId, LoggerContext.CHAT);
        }

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user.organization) {
            this.logger.error(
                `Blocked user ${user.idUser} from interacting with chat ${chatId}`,
                undefined,
                LoggerContext.CHAT,
            );
            throw new AccessDeniedError('User unauthorized to read this data');
        }

        const extraThreadMessages: { [threadId: string]: ChatMessage[] } = Object.fromEntries(
            await Promise.all(
                chat.threads.map(async (thread) => {
                    if (thread._count.messages > 2) {
                        const messages = await this.prisma.chatMessage.findMany({
                            where: { threadId: thread.id },
                            orderBy: { createdAt: 'asc' },
                            include: { informers: true },
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
            threads: threads,
        };
    }

    async getMessageById(messageId: string, user: DecodedUserTokenDto): Promise<GetChatResponseResponseDto> {
        const query = await this.prisma.chatMessage.findUnique({
            where: {
                id: messageId,
            },
            include: {
                informers: true,
                thread: { include: { chat: true } },
            },
        });

        if (
            query?.thread.chat.associatedEntityId !== user.idUser &&
            query?.thread.chat.associatedEntityId !== user.organization
        ) {
            this.logger.error(
                `Blocked user ${user.idUser} from querying message ${messageId}`,
                undefined,
                LoggerContext.CHAT,
            );
            throw new AccessDeniedError('User unauthorized to read this data');
        }

        return omit(query, ['thread']);
    }

    async listChats(page: number, user: DecodedUserTokenDto, getArchived = false): Promise<ListChatResponseDto> {
        const associatedEntityId = user.organization || user.idUser;

        const pageSize = 20;
        const chatsQuery = await this.prisma.chat.findMany({
            where: {
                associatedEntityId,
                userId: user.idUser,
                isArchived: getArchived,
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
                isFavorited: true,
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

    async getThreadById(chatId: string, threadId: string, user: DecodedUserTokenDto): Promise<ChatThreadResponseDto> {
        this.logger.log(`Retreiving messages for thead ${threadId}`, LoggerContext.CHAT);

        const queryRes = await this.prisma.chatMessageThread.findUniqueOrThrow({
            where: { id: threadId, chatId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        informers: true,
                    },
                },
                chat: true,
            },
        });

        if (
            queryRes.chat.associatedEntityId !== user.idUser &&
            queryRes.chat.associatedEntityId !== user.organization
        ) {
            this.logger.error(
                `Blocked user ${user.idUser} from querying thread ${threadId}`,
                undefined,
                LoggerContext.CHAT,
            );
            throw new AccessDeniedError('User unauthorized to read this thread');
        }

        return {
            threadId,
            totalMessageCount: queryRes.messages.length,
            timestamp: queryRes.createdAt,
            messages: queryRes.messages,
        };
    }

    private async getThreadHistory(
        isReplyMessage: boolean,
        threadId: string,
        chatId: string,
        editingMessageId?: string,
    ): Promise<OpenAIMessageHistory | undefined> {
        if (!isReplyMessage) {
            return;
        }

        this.logger.log(`Retrieving thread ${threadId} history for response continuation`, LoggerContext.CHAT);

        const queryRes = await this.prisma.chatMessage.findMany({
            where: { chatId, threadId: threadId },
            orderBy: { createdAt: 'asc' },
        });

        let rawHistory = queryRes;
        if (editingMessageId) {
            const editingMessageNdx = queryRes.findIndex((message) => message.id === editingMessageId);
            rawHistory = queryRes.slice(0, editingMessageNdx);
        }

        return this.openai.buildGptHistoryFromRawMessages(rawHistory);
    }
}
