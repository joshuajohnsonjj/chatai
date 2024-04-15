import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/handler';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            format: winston.format.uncolorize(),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.ms(),
                        nestWinstonModuleUtilities.format.nestLike(),
                    ),
                }),
                new CloudWatchTransport({
                    name: 'Cloudwatch Logs',
                    logGroupName: process.env.CLOUDWATCH_GROUP_NAME,
                    logStreamName: process.env.CLOUDWATCH_STREAM_NAME,
                    awsAccessKeyId: process.env.AWS_ACCESS_KEY,
                    awsSecretKey: process.env.AWS_KEY_SECRET,
                    awsRegion: process.env.AWS_REGION,
                    messageFormatter: function (item) {
                        return item.level + ': ' + item.message + ' ' + JSON.stringify(item.meta);
                    },
                }),
            ],
        }),
    });
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.listen(3000);
}
bootstrap();

// TODO: use config service
