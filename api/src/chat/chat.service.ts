import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type GeminiContentStream, GeminiService, type ChatHistory, type ChatTone } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
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
import { type DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AccessDeniedError, InternalError, ResourceNotFoundError } from 'src/exceptions';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { last, omit, reverse } from 'lodash';
import * as moment from 'moment';
import { PrismaError } from 'src/types';

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
        const matchedDataText = matchedDataResult.map((data) => data.text ?? '');
        // .filter((data) => data.score >= normalizedMinConfidence)

        let chatHistory: ChatHistory[] | undefined;
        if (params.isReplyMessage) {
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
            matchedDataText.join('. '),
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
        replyThreadId: string,
    ): Promise<GetChatResponseResponseDto> {
        const threadId = replyThreadId ?? v4();
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

    async startNewChat(params: StartNewChatQueryDto): Promise<ChatResponseDto> {
        // TODO: need to validate associatedEntityId here
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
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            select: { associatedEntityId: true },
        });

        if (!chat) {
            this.logger.error(`Chat ${chatId} does not exist`, undefined, 'Chat');
            throw new ResourceNotFoundError(chatId, 'Chat');
        }

        if (chat.associatedEntityId !== user.idUser && chat.associatedEntityId !== user.organization) {
            this.logger.error(`Blocked user ${user.idUser} from interacting with chat ${chatId}`, undefined, 'Chat');
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

        const threads: ChatThreadResponseDto[] = [];
        messages.forEach((message) => {
            if (last(threads)?.threadId !== message.threadId) {
                threads.push({
                    threadId: message.threadId,
                    messages: [message],
                });
            } else {
                last(threads)!.messages.unshift(message);
            }
        });

        return {
            page,
            size: messages.length,
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
            ...omit(chat, ['updatedAt', 'gptMessages']),
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
