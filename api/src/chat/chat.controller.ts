import { BadRequestException, Controller, Get, Param, Body, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { AuthGuard } from '@nestjs/passport';
import { Query, Request } from '@nestjs/common/decorators';
import {
    GetChatResponseQueryDto,
    type GetChatResponseResponseDto,
    ListChatQueryDto,
    type ListChatResponseDto,
} from './dto/message.dto';
import { StartNewChatQueryDto, type StartNewChatResponseDto } from './dto/chat.dto';

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
        @Request() req,
    ): Promise<GetChatResponseResponseDto> {
        return await this.service.generateResponse(chatId, params.entityId, params.text, req.user);
    }

    @Get(':chatId')
    async listChat(@Param('chatId') chatId: string, @Query() { page }: ListChatQueryDto, @Request() req): Promise<ListChatResponseDto> {
        return await this.service.listChat(chatId, page, req.body);
    }
}
