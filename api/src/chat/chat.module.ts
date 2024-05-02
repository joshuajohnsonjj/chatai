import { Logger, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongoModule } from '../mongo/mongo.module';

@Module({
    imports: [MongoModule],
    providers: [ChatService, Logger],
    controllers: [ChatController],
})
export class ChatModule {}
