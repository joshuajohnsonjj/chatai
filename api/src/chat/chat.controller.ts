import { BadRequestException, Controller, Get, Param, Body, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { AuthGuard } from '@nestjs/passport';
import { Query } from '@nestjs/common/decorators';
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
        try {
            return await this.service.startNewChat(params);
        } catch (e) {
            throw new BadRequestException(e.message);
        }
    }

    @Post(':chatId')
    async generateChatResponse(
        @Param('chatId') chatId: string,
        @Body() params: GetChatResponseQueryDto,
    ): Promise<GetChatResponseResponseDto> {
        try {
            return await this.service.generateResponse(chatId, params.entityId, params.text);
        } catch (e) {
            throw new BadRequestException(e.message);
        }
    }

    @Get(':chatId')
    async listChat(@Param('chatId') chatId: string, @Query() { page }: ListChatQueryDto): Promise<ListChatResponseDto> {
        try {
            return await this.service.listChat(chatId, page);
        } catch (e) {
            throw new BadRequestException(e.message);
        }
    }
}
