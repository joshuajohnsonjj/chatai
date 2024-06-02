import { Logger, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
    providers: [UserService, Logger],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {}
