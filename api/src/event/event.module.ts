import { Logger, Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';

@Module({
    providers: [EventService, Logger],
    controllers: [EventController],
})
export class EventModule {}
