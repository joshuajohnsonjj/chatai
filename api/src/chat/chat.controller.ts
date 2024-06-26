import { Controller, Get, Param, Body, Post, Query, Req, UseGuards, Patch, Res, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
    type ChatThreadResponseDto,
    GetChatResponseQueryDto,
    type GetChatResponseResponseDto,
    ListChatMessagesQueryDto,
    type ListChatMessagesResponseDto,
} from './dto/message.dto';
import {
    type ChatResponseDto,
    type ListChatResponseDto,
    StartNewChatQueryDto,
    UpdateChatDetailRequestDto,
} from './dto/chat.dto';
import { Request, Response } from 'express';
import { DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoggerContext } from 'src/constants';

@Controller('v1/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(
        private readonly service: ChatService,
        private readonly logger: Logger,
    ) {}

    @Post()
    async startNewChat(@Body() params: StartNewChatQueryDto, @Req() req: Request): Promise<ChatResponseDto> {
        return await this.service.startNewChat(params, req.user as DecodedUserTokenDto);
    }

    @Get()
    async listChats(@Query() query: ListChatMessagesQueryDto, @Req() req: Request): Promise<ListChatResponseDto> {
        return await this.service.listChats(query.page, req.user as DecodedUserTokenDto, query.getArchived === '1');
    }

    @Patch(':chatId')
    async updateChatDetail(
        @Param('chatId') chatId: string,
        @Body() params: UpdateChatDetailRequestDto,
        @Req() req: Request,
    ): Promise<ChatResponseDto> {
        return await this.service.updateChatDetail(chatId, params, req.user as DecodedUserTokenDto);
    }

    @Post(':chatId/message')
    async generateChatResponse(
        @Param('chatId') chatId: string,
        @Body() params: GetChatResponseQueryDto,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        res.setHeader('Content-Type', 'text/plain');

        try {
            const data = await this.service.generateResponse(chatId, params, req.user as DecodedUserTokenDto);

            this.logger.log('Chunking response content', LoggerContext.CHAT);
            let generatedResponse = '';
            for await (const chunk of data.stream) {
                const chunkText = chunk.choices[0]?.delta?.content;

                if (!chunkText) {
                    continue;
                }

                generatedResponse += chunkText;
                res.write(chunkText);
            }
            this.logger.log('Chunking response content finished', LoggerContext.CHAT);

            await this.service.handleChatResponseCompletion(
                params.userPromptMessageId,
                params.userPromptText,
                generatedResponse,
                chatId,
                params.threadId,
                params.isReplyMessage,
                params.systemResponseMessageId,
                data.matchedDataResult,
            );
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.CHAT);
        } finally {
            res.end();
        }
    }

    @Post(':chatId/message/:messageId')
    async generateUpdatedChatResponse(
        @Param('chatId') chatId: string,
        @Param('messageId') messageId: string,
        @Body() params: GetChatResponseQueryDto,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        res.setHeader('Content-Type', 'text/plain');

        try {
            this.logger.log(`Updating chat message ${messageId}`, LoggerContext.CHAT);

            const data = await this.service.generateResponse(
                chatId,
                params,
                req.user as DecodedUserTokenDto,
                messageId,
            );

            this.logger.log('Chunking response content', LoggerContext.CHAT);
            let generatedResponse = '';
            for await (const chunk of data.stream) {
                const chunkText = chunk.choices[0]?.delta?.content;

                if (!chunkText) {
                    continue;
                }

                generatedResponse += chunkText;
                res.write(chunkText);
            }
            this.logger.log('Chunking response content finished', LoggerContext.CHAT);

            await this.service.handleUpdatedChatResponseCompletion(
                params.userPromptMessageId,
                params.userPromptText,
                generatedResponse,
                chatId,
                params.threadId,
                params.systemResponseMessageId,
                data.matchedDataResult,
            );
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.CHAT);
        } finally {
            res.end();
        }
    }

    @Get(':chatId/message')
    async listChatMessages(
        @Param('chatId') chatId: string,
        @Query() { page }: ListChatMessagesQueryDto,
        @Req() req: Request,
    ): Promise<ListChatMessagesResponseDto> {
        return await this.service.listChatMessages(chatId, page, req.user as DecodedUserTokenDto);
    }

    @Get(':chatId/message/:messageId')
    async getMessageById(
        @Param('messageId') messageId: string,
        @Req() req: Request,
    ): Promise<GetChatResponseResponseDto> {
        return await this.service.getMessageById(messageId, req.user as DecodedUserTokenDto);
    }

    @Get(':chatId/thread/:threadId')
    async getThreadById(
        @Param('chatId') chatId: string,
        @Param('threadId') threadId: string,
        @Req() req: Request,
    ): Promise<ChatThreadResponseDto> {
        return await this.service.getThreadById(chatId, threadId, req.user as DecodedUserTokenDto);
    }
}
