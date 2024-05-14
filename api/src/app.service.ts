import { Injectable, Logger } from '@nestjs/common';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}

    async encryptString(stringToEncrypt: string): Promise<string> {
        this.logger.log('Encrypting string', 'Root');

        return new RsaCipher().encrypt(stringToEncrypt, this.configService.get<string>('RSA_PUBLIC_KEY')!);
    }
}
