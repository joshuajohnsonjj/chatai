import { Controller, Get, Param, Body, Post, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { AuthGuard } from '@nestjs/passport';
import {
    GetChatResponseQueryDto,
    type GetChatResponseResponseDto,
    ListChatQueryDto,
    type ListChatResponseDto,
} from './dto/message.dto';
import { StartNewChatQueryDto, type StartNewChatResponseDto } from './dto/chat.dto';
import { Request } from 'express';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';

@Controller('chat')
// @UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(private readonly service: ChatService) {}

    @Post()
    async startNewChat(@Body() params: StartNewChatQueryDto): Promise<StartNewChatResponseDto> {
        return await this.service.startNewChat(params);
    }

    @Post(':chatId')
    async generateChatResponse(
        @Param('chatId') chatId: string,
        @Body() params: GetChatResponseQueryDto,
        @Req() req: Request,
    ): Promise<GetChatResponseResponseDto> {
        return await this.service.generateResponse(
            chatId,
            params.entityId,
            params.text,
            req.user as DecodedUserTokenDto,
        );
    }

    @Get(':chatId')
    async listChat(
        @Param('chatId') chatId: string,
        @Query() { page }: ListChatQueryDto,
        @Req() req: Request,
    ): Promise<ListChatResponseDto> {
        return await this.service.listChat(chatId, page, req.user as DecodedUserTokenDto);
    }
}
