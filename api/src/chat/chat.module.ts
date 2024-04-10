import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
    imports: [],
    providers: [ChatService],
    controllers: [ChatController],
})
export class ChatModule {}
