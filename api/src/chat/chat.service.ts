import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getEmbeddingsFromText, getQuestionResponseBasedOnQueryResults } from 'src/services/openai';
import { queryQdrant } from 'src/services/qdrant';
import type { GetChatResponseResponseDto, ListChatResponseDto } from './dto/message.dto';
import type { StartNewChatQueryDto, StartNewChatResponseDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
	constructor (private readonly prisma: PrismaService) {}

	async generateResponse (chatId: string, entityId: string, text: string): Promise<GetChatResponseResponseDto> {
		return await this.prisma.$transaction(async (tx) => {
			await tx.chatMessage.create({
				data: {
					text,
					isSystemMessage: false,
					chatId
				}
			});

			const questionVector = await getEmbeddingsFromText(text);
			const queryResult = await queryQdrant(questionVector, entityId);
			const generatedResponse = await getQuestionResponseBasedOnQueryResults(
				text,
				queryResult
			);

			const savedResponse = await tx.chatMessage.create({
				data: {
					text: generatedResponse,
					chatId,
					isSystemMessage: true
				}
			});

			return savedResponse;
		});
	}

	async startNewChat (params: StartNewChatQueryDto): Promise<StartNewChatResponseDto> {
		return await this.prisma.chat.create({
			data: {
				userId: params.userId,
				title: params.title,
				chatType: params.chatType
			}
		});
	}

	async listChat (chatId: string, page: number): Promise<ListChatResponseDto> {
		const pageSize = 20;
		const messages = await this.prisma.chatMessage.findMany({
			where: {
				chatId
			},
			orderBy: {
				createdAt: 'desc'
			},
			take: pageSize,
			skip: page * pageSize
		});

		return {
			page,
			size: pageSize,
			messages
		};
	}
}
