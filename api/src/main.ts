import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/handler';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as CloudWatchTransport from 'winston-cloudwatch';

const localLogger = WinstonModule.createLogger({
    format: winston.format.uncolorize(),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                nestWinstonModuleUtilities.format.nestLike(),
            ),
        }),
    ],
});

const cloudwatchLogger = WinstonModule.createLogger({
    format: winston.format.uncolorize(),
    transports: [
        new CloudWatchTransport({
            name: 'Cloudwatch API Logs',
            logGroupName: process.env.CLOUDWATCH_GROUP_NAME,
            logStreamName: `${process.env.CLOUDWATCH_GROUP_NAME}-${process.env.NODE_ENV}`,
            awsAccessKeyId: process.env.AWS_ACCESS_KEY,
            awsSecretKey: process.env.AWS_KEY_SECRET,
            awsRegion: process.env.AWS_REGION,
            messageFormatter: function (item) {
                return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta);
            },
        }),
    ],
});

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: process.env.NODE_ENV === 'dev' ? localLogger : cloudwatchLogger,
    });
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.enableCors();
    await app.listen(process.env.APP_PORT || 3001);
}
bootstrap();
