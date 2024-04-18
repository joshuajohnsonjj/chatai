import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DecodedUserTokenDto } from './dto/jwt.dto';
import { CognitoAttribute, CognitoIdUserPayload } from 'src/types';
import { AccessDeniedError } from 'src/exceptions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            audience: process.env.AWS_COGNITO_COGNITO_CLIENT_ID,
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


    validate(payload: CognitoIdUserPayload): DecodedUserTokenDto {
        if (!payload.sub) {
            throw new AccessDeniedError('Invalid bearer token');
        }

        return {
            idUser: payload.sub,
            oganizationUserRole: payload[CognitoAttribute.ORG_USER_ROLE] ?? '',
            organization: payload[CognitoAttribute.ORG] ?? '',
        };
    }
}
