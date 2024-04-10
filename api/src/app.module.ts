import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { DataSourceModule } from './dataSource/dataSource.module';

@Module({
    imports: [PrismaModule, ChatModule, DataSourceModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
