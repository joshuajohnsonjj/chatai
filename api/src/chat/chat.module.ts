import { Logger, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
    imports: [],
    providers: [ChatService, Logger],
    controllers: [ChatController],
})
export class ChatModule {}
