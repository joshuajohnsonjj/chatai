import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { IncomingMessage } from 'http';
import { HttpStatus } from '@nestjs/common';
import { ErrorTypes } from '.';

const getStatusCode = (exceptionName: string): number => {
    switch (exceptionName) {
        case ErrorTypes.BadRequestError:
            return HttpStatus.BAD_REQUEST;
        case ErrorTypes.BadCredentialsError:
            return HttpStatus.FORBIDDEN;
        case ErrorTypes.ResourceNotFoundError:
            return HttpStatus.NOT_FOUND;
        case ErrorTypes.AccessDeniedError:
            return HttpStatus.UNAUTHORIZED;
        default:
            return HttpStatus.INTERNAL_SERVER_ERROR;
    }
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<IncomingMessage>();
        const code = getStatusCode(exception.name);
        const message = exception.message;

        response.status(code).json({
            error: {
                timestamp: new Date().toISOString(),
                path: request.url,
                name: exception.name,
                code,
                message,
            },
        });
    }
}
