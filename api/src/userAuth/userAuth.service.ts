import { Injectable, Logger } from '@nestjs/common';
import {
    AdminUpdateUserAttributesCommand,
    AuthFlowType,
    ChangePasswordCommand,
    CognitoIdentityProviderClient,
    ConfirmForgotPasswordCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    InitiateAuthCommand,
    ResendConfirmationCodeCommand,
    SignUpCommand,
    UpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { ConfigService } from '@nestjs/config';
import { type RegisterRequestDto } from './dto/register.request.dto';
import { type AuthenticateRequestDto } from './dto/authenticate.request.dto';
import { type ConfirmUserRequestDto } from './dto/confirm.request.dto';
import { type RefreshUserSessionRequestDto } from './dto/refresh.request.dto';
import { type ForgetRequestDto } from './dto/forget.request.dto';
import { type ResetRequestDto } from './dto/reset.request.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { STRIPE_PRODUCTS } from 'src/constants/stripe';
import { CognitoAttribute, OganizationUserRole } from 'src/types';
import { UserInviteType, UserType } from '@prisma/client';
import { StripeService } from 'src/services/stripe';
import { type JwtPayload, decode } from 'jsonwebtoken';
import { LoggerContext } from 'src/constants';
import { BadRequestError, UserNotConfirmedError } from 'src/exceptions';
import type { AuthenticateResponseDto, RegisterResponseDto } from './dto/response.dto';

@Injectable()
export class UserAuthService {
    private readonly identityClient = new CognitoIdentityProviderClient({
        region: this.configService.get<string>('AWS_REGION')!,
    });

    private readonly stripeService = new StripeService(this.configService.get<string>('STRIPE_KEY')!);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
    ) {}

    async register(authRegisterRequest: RegisterRequestDto): Promise<RegisterResponseDto> {
        const { firstName, lastName, email, password } = authRegisterRequest;

        this.logger.log(`Creating new user ${email}`, LoggerContext.USER_AUTH);

        const signupInput = {
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            Username: email,
            Password: password,
            UserAttributes: [
                {
                    Name: CognitoAttribute.ORG,
                    Value: '',
                },
                {
                    Name: CognitoAttribute.ORG_USER_ROLE,
                    Value: '',
                },
            ],
        };

        const signupResponse = await this.identityClient.send(new SignUpCommand(signupInput));

        const userId = signupResponse.UserSub as string;

        const [accountPlan, stripeCustomer] = await Promise.all([
            this.prisma.accountPlan.findUniqueOrThrow({
                where: { stripeProductId: STRIPE_PRODUCTS.INDIVIDUAL_STARTER },
            }),
            this.stripeService.createCustomer(`${firstName} ${lastName}`, email),
        ]);

        await this.prisma.user.create({
            data: {
                id: userId,
                firstName,
                lastName,
                email,
                stripeCustomerId: stripeCustomer.id,
                type: UserType.INDIVIDUAL,
                planId: accountPlan.id,
            },
        });

        await this.prisma.entitySettings.create({
            data: { associatedUserId: userId },
        });

        return {
            uuid: userId,
            userConfirmed: signupResponse.UserConfirmed ?? false,
        };
    }

    async acceptInvite(inviteId: string, authRegisterRequest: RegisterRequestDto): Promise<RegisterResponseDto> {
        const { firstName, lastName, email, password } = authRegisterRequest;

        this.logger.log(`Accepting invite ${inviteId} for ${email}`, LoggerContext.USER_AUTH);

        const userInvite = await this.prisma.userInvite.update({
            where: { id: inviteId },
            data: { isAccepted: true, updatedAt: new Date() },
            select: { type: true, organizationId: true },
        });

        const signupInput = {
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            Username: email,
            Password: password,
            UserAttributes: [
                {
                    Name: CognitoAttribute.ORG,
                    Value: userInvite.organizationId,
                },
                {
                    Name: CognitoAttribute.ORG_USER_ROLE,
                    Value:
                        userInvite.type === UserInviteType.ADMIN
                            ? OganizationUserRole.ORG_ADMIN
                            : OganizationUserRole.ORG_MEMBER,
                },
            ],
        };

        const signupResponse = await this.identityClient.send(new SignUpCommand(signupInput));

        const userId = signupResponse.UserSub as string;

        const stripeCustomer = await this.stripeService.createCustomer(`${firstName} ${lastName}`, email);

        await this.prisma.user.create({
            data: {
                id: userId,
                firstName,
                lastName,
                email,
                stripeCustomerId: stripeCustomer.id,
                type: UserType.ORGANIZATION_MEMBER,
                organizationId: userInvite.organizationId,
            },
        });

        this.logger.log(`invite ${inviteId} accepted for ${email}, created user ${userId}`, LoggerContext.USER_AUTH);

        return {
            uuid: userId,
            userConfirmed: signupResponse.UserConfirmed ?? false,
        };
    }

    async updateAttributes(email: string, updates: { Name: string; Value: string }[]): Promise<void> {
        this.logger.log(
            `Attempting to update attributes for ${email}:  ${JSON.stringify(updates)}`,
            LoggerContext.USER_AUTH,
        );

        const input = {
            UserPoolId: this.configService.get<string>('AWS_COGNITO_USER_POOL_ID')!,
            Username: email,
            UserAttributes: updates,
        };

        await this.identityClient.send(new AdminUpdateUserAttributesCommand(input));

        this.logger.log(`Attributes updated for ${email}`);
    }

    async updatePassword(accessToken: string, oldPassword: string, newPassword): Promise<void> {
        this.logger.log('Attempting to update user password', LoggerContext.USER_AUTH);

        try {
            await this.identityClient.send(
                new ChangePasswordCommand({
                    AccessToken: accessToken,
                    PreviousPassword: oldPassword,
                    ProposedPassword: newPassword,
                }),
            );

            this.logger.log('Password updated', LoggerContext.USER_AUTH);
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(e.message);
        }
    }

    async updateEmail(accessToken: string, newEmail: string): Promise<void> {
        try {
            const command = new UpdateUserAttributesCommand({
                AccessToken: accessToken,
                UserAttributes: [
                    {
                        Name: 'preferred_username',
                        Value: newEmail,
                    },
                ],
            });
            await this.identityClient.send(command);
            this.logger.log(`Email changed successfully ${newEmail}`, LoggerContext.USER_AUTH);
        } catch (error) {
            this.logger.error(error.message, error.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(error.message);
        }
    }

    async authenticate(user: AuthenticateRequestDto): Promise<AuthenticateResponseDto> {
        const { username, password } = user;

        this.logger.log(`Attempting to authenticate user ${username}`, LoggerContext.USER_AUTH);

        const params = {
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        };

        try {
            const response = await this.identityClient.send(new InitiateAuthCommand(params));
            const decodedIdToken = decode(response.AuthenticationResult!.IdToken!) as JwtPayload;

            this.logger.log(`Authentication of user ${username} succeeded`, LoggerContext.USER_AUTH);

            return {
                accessToken: response.AuthenticationResult!.AccessToken!,
                refreshToken: response.AuthenticationResult!.RefreshToken!,
                userId: decodedIdToken.sub!,
                email: decodedIdToken.email,
                name: decodedIdToken.name,
            };
        } catch (error) {
            this.logger.error(error.message, error.stack, LoggerContext.USER_AUTH);
            if (error.name === 'UserNotConfirmedException') {
                throw new UserNotConfirmedError('User must complete confirmation to login');
            }
            throw new BadRequestError(error.message);
        }
    }

    async confirmUser(userData: ConfirmUserRequestDto): Promise<void> {
        this.logger.log(`Confirming signup for user ${userData.username}`, LoggerContext.USER_AUTH);

        const confirmInput = {
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            Username: userData.username,
            ConfirmationCode: userData.code,
        };

        try {
            await this.identityClient.send(new ConfirmSignUpCommand(confirmInput));

            this.logger.log(`signup confirmed for user ${userData.username}`, LoggerContext.USER_AUTH);
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(e.message);
        }
    }

    async resendConfirmEmail(email: string): Promise<void> {
        this.logger.log(`attempting to resend confirmation email for user ${email}`, LoggerContext.USER_AUTH);

        const resendInput = {
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            Username: email,
        };

        try {
            await this.identityClient.send(new ResendConfirmationCodeCommand(resendInput));

            this.logger.log(`email sent for user ${email}`, LoggerContext.USER_AUTH);
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(e.message);
        }
    }

    async forget(forgetPasswordRequest: ForgetRequestDto): Promise<void> {
        const { email } = forgetPasswordRequest;

        this.logger.log(`Initiating forgot password flow for user ${email}`, LoggerContext.USER_AUTH);

        const forgotInput = {
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            Username: email,
        };

        try {
            await this.identityClient.send(new ForgotPasswordCommand(forgotInput));

            this.logger.log(`forgot password flow for user ${email} initiated successfuly`, LoggerContext.USER_AUTH);
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(e.message);
        }
    }

    async reset(resetPasswordRequest: ResetRequestDto): Promise<void> {
        const { email, password, code } = resetPasswordRequest;

        this.logger.log(`Attepmting to reset passowrd for user ${email}`, LoggerContext.USER_AUTH);

        const resetInput = {
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            Username: email,
            ConfirmationCode: code,
            Password: password,
        };

        try {
            await this.identityClient.send(new ConfirmForgotPasswordCommand(resetInput));

            this.logger.log(`reset passowrd for user ${email} succeeded`, LoggerContext.USER_AUTH);
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(e.message);
        }
    }

    async refreshUserSession(userData: RefreshUserSessionRequestDto): Promise<AuthenticateResponseDto> {
        this.logger.log(`Attepmting to refresh session for user ${userData.username}`, LoggerContext.USER_AUTH);

        const refreshInput = {
            AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
            AuthParameters: {
                REFRESH_TOKEN: userData.refreshToken,
                USERNAME: userData.username,
            },
        };

        try {
            const response = await this.identityClient.send(new InitiateAuthCommand(refreshInput));
            const decodedIdToken = decode(response.AuthenticationResult!.IdToken!) as JwtPayload;

            this.logger.log(`Refresh session for user ${userData.username} succeeded`, LoggerContext.USER_AUTH);

            return {
                accessToken: response.AuthenticationResult!.AccessToken!,
                refreshToken: response.AuthenticationResult!.RefreshToken!,
                userId: decodedIdToken.sub!,
                email: decodedIdToken.email,
                name: decodedIdToken.name,
            };
        } catch (error) {
            this.logger.error(error.message, error.stack, LoggerContext.USER_AUTH);
            throw new BadRequestError(error.message);
        }
    }
}
