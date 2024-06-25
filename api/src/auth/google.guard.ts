import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    constructor(private readonly scopes: string[]) {
        super({
            passReqToCallback: true,
        });
    }

    handleRequest(err, user, _info, _context: ExecutionContext, _status) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }

    getAuthenticateOptions(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();
        return {
            scope: this.scopes,
            state: JSON.stringify({
                reqQuery: request.query,
                reqPath: request.route.path,
            }),
        };
    }
}
