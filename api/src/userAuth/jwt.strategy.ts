import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            _audience: process.env.AWS_COGNITO_COGNITO_CLIENT_ID,
            issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`,
            algorithms: ['RS256'],
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
            }),
        });
    }

    async validate(payload: any) {
        return { idUser: payload.sub, email: payload.email };
    }
}
