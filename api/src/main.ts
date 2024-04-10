import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/handler';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.listen(3000);
}
bootstrap();
