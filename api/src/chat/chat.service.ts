import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantWrapper } from '@joshuajohnsonjj38/qdrant';
import type { GetChatResponseResponseDto, ListChatResponseDto } from './dto/message.dto';
import type { StartNewChatQueryDto, StartNewChatResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) {}

    async generateResponse(chatId: string, entityId: string, text: string): Promise<GetChatResponseResponseDto> {
        return await this.prisma.$transaction(async (tx) => {
            await tx.chatMessage.create({
                data: {
                    text,
                    isSystemMessage: false,
                    chatId,
                },
            });

            const openai = new OpenAIWrapper(process.env.OPENAI_SECRET as string);

            const questionVector = await openai.getTextEmbedding(text);
            const queryResult = await new QdrantWrapper(
                process.env.QDRANT_URL as string,
                parseInt(process.env.QDRANT_PORT as string, 10),
                process.env.QDRANT_COLLECTION as string,
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
            },
        });
    }

    async listChat(chatId: string, page: number): Promise<ListChatResponseDto> {
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
