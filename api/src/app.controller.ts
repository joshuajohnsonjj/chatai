import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/encryption')
    getEncryptedString(@Query() query: { str: string }): Promise<string> {
        return this.appService.encryptString(query.str);
    }
}
