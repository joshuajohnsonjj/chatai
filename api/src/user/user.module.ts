import { Logger, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserAuthModule } from 'src/userAuth/userAuth.module';

@Module({
    providers: [UserService, Logger],
    exports: [UserService],
    controllers: [UserController],
    imports: [UserAuthModule],
})
export class UserModule {}
