import { Controller, Get, Param, Body, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import type {
    GetChatResponseQueryDto,
    GetChatResponseResponseDto,
    ListChatMessagesQueryDto,
    ListChatMessagesResponseDto,
} from './dto/message.dto';
import { ListChatResponseDto, StartNewChatQueryDto, type StartNewChatResponseDto } from './dto/chat.dto';
import { Request } from 'express';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly service: ChatService) {}

    @Post()
    async startNewChat(@Body() params: StartNewChatQueryDto): Promise<StartNewChatResponseDto> {
        return await this.service.startNewChat(params);
    }

    @Get()
    async listChats(@Query() { page }: ListChatMessagesQueryDto, @Req() req: Request): Promise<ListChatResponseDto> {
        return await this.service.listChats(page, req.user as DecodedUserTokenDto);
    }

    @Post(':chatId')
    async generateChatResponse(
        @Param('chatId') chatId: string,
        @Body() params: GetChatResponseQueryDto,
        @Req() req: Request,
    ): Promise<GetChatResponseResponseDto> {
        // TODO: figure out how to spead up responses.. http streaming?
        return await this.service.generateResponse(
            params.promptId,
            chatId,
            params.text,
            req.user as DecodedUserTokenDto,
            params.replyThreadId,
        );
    }

    @Get(':chatId')
    async listChatMessages(
        @Param('chatId') chatId: string,
        @Query() { page }: ListChatMessagesQueryDto,
        @Req() req: Request,
    ): Promise<ListChatMessagesResponseDto> {
        return await this.service.listChatMessages(chatId, page, req.user as DecodedUserTokenDto);
    }
}
