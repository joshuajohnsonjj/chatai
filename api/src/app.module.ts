import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { DataSourceModule } from './dataSource/dataSource.module';
import { OrganizationModule } from './organization/organization.module';
import { UserAuthModule } from './userAuth/userAuth.module';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { UserModule } from './user/user.module';

@Module({
    imports: [
        PrismaModule,
        ChatModule,
        DataSourceModule,
        OrganizationModule,
        UserAuthModule,
        UserModule,
        ConfigModule.forRoot({
            envFilePath: ['.env.test', '.env.prod'],
            isGlobal: true,
        }),
    ],
    controllers: [AppController],
    providers: [AppService, Logger],
})
export class AppModule {}
