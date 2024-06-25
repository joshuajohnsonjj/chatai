import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class MultiAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly googleAuthService: AuthService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authorization = request.headers['authorization'];

        if (authorization && authorization.startsWith('Bearer ')) {
            const token = authorization.split(' ')[1];

            // First, attempt to verify as a Cognito token
            try {
                const payload = this.jwtService.verify(token, {
                    audience: process.env.AWS_COGNITO_CLIENT_ID,
                    issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`,
                });
                request.user = payload;
                return true;
            } catch (cognitoError) {
                // If not a valid Cognito token, try verifying as a Google token
                try {
                    const googleUser = await this.googleAuthService.verifyGoogleToken(token);
                    request.user = googleUser;
                    return true;
                } catch (googleError) {
                    throw new UnauthorizedException('Invalid token');
                }
            }
        }
        return false;
    }
}
