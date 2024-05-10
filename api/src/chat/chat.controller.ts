import { Controller, Get, Param, Body, Post, Query, Req, UseGuards, Patch, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { GetChatResponseQueryDto, ListChatMessagesQueryDto, ListChatMessagesResponseDto } from './dto/message.dto';
import type {
    ChatResponseDto,
    ListChatResponseDto,
    StartNewChatQueryDto,
    UpdateChatDetailRequestDto,
} from './dto/chat.dto';
import { Request, Response } from 'express';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly service: ChatService) {}

    @Post()
    async startNewChat(@Body() params: StartNewChatQueryDto): Promise<ChatResponseDto> {
        return await this.service.startNewChat(params);
    }

    @Get()
    async listChats(@Query() { page }: ListChatMessagesQueryDto, @Req() req: Request): Promise<ListChatResponseDto> {
        return await this.service.listChats(page, req.user as DecodedUserTokenDto);
    }

    @Patch(':chatId')
    async updateChatDetail(
        @Param('chatId') chatId: string,
        @Body() params: UpdateChatDetailRequestDto,
        @Req() req: Request,
    ): Promise<ChatResponseDto> {
        // TODO: figure out how to spead up responses.. http streaming?
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

        const contentStream = await this.service.generateResponse(chatId, params, req.user as DecodedUserTokenDto);

        let generatedResponse = '';
        for await (const chunk of contentStream.stream) {
            const chunkText = chunk.text();
            generatedResponse += chunkText;
            res.write(chunkText);
        }

        await this.service.handleChatResponseCompletion(
            params.userPromptMessageId,
            params.userPromptText,
            generatedResponse,
            chatId,
            params.replyThreadId,
        );

        res.end();
    }

    @Get(':chatId/message')
    async listChatMessages(
        @Param('chatId') chatId: string,
        @Query() { page }: ListChatMessagesQueryDto,
        @Req() req: Request,
    ): Promise<ListChatMessagesResponseDto> {
        return await this.service.listChatMessages(chatId, page, req.user as DecodedUserTokenDto);
    }
}
