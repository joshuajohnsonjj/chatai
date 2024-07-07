import { Controller, Body, Post, Res } from '@nestjs/common';
import { EventService } from './event.service';
import type { SlackEventAPIPayload } from './types/slack';
import { Response } from 'express';

@Controller('v1/event')
export class EventController {
    constructor(private readonly service: EventService) {}

    @Post('slack')
    async handleSlackEvent(@Body() payload: SlackEventAPIPayload, @Res() res: Response) {
        await this.service.queueSlackUpdate(payload);
        res.status(200).send();
    }
}
