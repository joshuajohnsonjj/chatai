import { Logger, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    providers: [UserService, Logger],
    exports: [UserService],
    controllers: [UserController],
    imports: [AuthModule],
})
export class UserModule {}
