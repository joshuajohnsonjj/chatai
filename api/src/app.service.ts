import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}
}
