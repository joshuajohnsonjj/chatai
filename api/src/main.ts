import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/handler';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as CloudWatchTransport from 'winston-cloudwatch';
import * as passport from 'passport';
import 'reflect-metadata';
import { BadRequestError } from './exceptions';
import { ValidationError } from 'class-validator';

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

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            exceptionFactory: (errors) => {
                const detailedErrors = errors.map((error: ValidationError) => ({
                    msg: error.toString(),
                    value: error.value,
                }));

                if (process.env.NODE_ENV === 'dev')
                    localLogger.warn(`Req faildation failed: ${JSON.stringify(detailedErrors)}`);
                else cloudwatchLogger.warn(`Req faildation failed: ${JSON.stringify(detailedErrors)}`);

                return new BadRequestError(errors.map((error) => Object.values(error.constraints ?? {})).join(', '));
            },
        }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());

    app.enableCors({
        origin: true,
        methods: 'GET,POST,PATCH,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
    });

    app.use(passport.initialize());

    await app.listen(process.env.PORT || 3001);
}

bootstrap();
