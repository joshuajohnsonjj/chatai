import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { DataSourceModule } from './dataSource/dataSource.module';
import { OrganizationModule } from './organization/organization.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { SearchModule } from './search/search.module';
// import { GoogleAuthModule } from './googleAuth/googleAuth.module';

@Module({
    imports: [
        PrismaModule,
        ChatModule,
        DataSourceModule,
        OrganizationModule,
        AuthModule,
        // GoogleAuthModule,
        SearchModule,
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
