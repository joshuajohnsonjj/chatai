import { Injectable } from '@nestjs/common';
import {
    AuthenticationDetails,
    CognitoRefreshToken,
    CognitoUser,
    CognitoUserAttribute,
    CognitoUserPool,
} from 'amazon-cognito-identity-js';
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

@Injectable()
export class UserAuthService {
    private readonly userPool: CognitoUserPool;

    private readonly stripeService = new StripeService(this.configService.get<string>('STRIPE_KEY')!);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.userPool = new CognitoUserPool({
            UserPoolId: this.configService.get<string>('AWS_COGNITO_USER_POOL_ID')!,
            ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID')!,
        });
    }

    async register(authRegisterRequest: RegisterRequestDto) {
        const { firstName, lastName, email, password, phoneNumber } = authRegisterRequest;
        return await new Promise((resolve, reject) => {
            this.userPool.signUp(
                email,
                password,
                [
                    new CognitoUserAttribute({ Name: CognitoAttribute.ORG, Value: '' }),
                    new CognitoUserAttribute({ Name: CognitoAttribute.ORG_USER_ROLE, Value: '' })
                ],
                [],
                async (err, result) => {
                    if (!result) {
                        reject(err);
                    } else {
                        const userId = result.userSub;

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
                                phoneNumber,
                                stripeCustomerId: stripeCustomer.id,
                                type: UserType.INDIVIDUAL,
                                planId: accountPlan.id,
                            },
                        });

                        resolve({
                            uuid: userId,
                            userConfirmed: result.userConfirmed,
                            success: true,
                        });
                    }
                },
            );
        });
    }

    async acceptInvite(inviteId: string, authRegisterRequest: RegisterRequestDto) {
        const { firstName, lastName, email, password, phoneNumber } = authRegisterRequest;

        const userInvite = await this.prisma.userInvite.update({
            where: { id: inviteId },
            data: { isAccepted: true, updatedAt: new Date() },
            select: { type: true, organizationId: true },
        });

        return await new Promise((resolve, reject) => {
            this.userPool.signUp(
                email,
                password,
                [
                    new CognitoUserAttribute({ Name: CognitoAttribute.ORG, Value: userInvite.organizationId }),
                    new CognitoUserAttribute({
                        Name: CognitoAttribute.ORG_USER_ROLE,
                        Value:
                            userInvite.type === UserInviteType.ADMIN
                                ? OganizationUserRole.ORG_ADMIN
                                : OganizationUserRole.ORG_MEMBER,
                    }),
                ],
                [],
                async (err, result) => {
                    if (!result) {
                        reject(err);
                    } else {
                        const userId = result.userSub;

                        const stripeCustomer = await this.stripeService.createCustomer(`${firstName} ${lastName}`, email);

                        await this.prisma.user.create({
                            data: {
                                id: userId,
                                firstName,
                                lastName,
                                phoneNumber,
                                email,
                                stripeCustomerId: stripeCustomer.id,
                                type: UserType.ORGANIZATION_MEMBER,
                                organizationId: userInvite.organizationId,
                            },
                        });

                        resolve({
                            uuid: userId,
                            userConfirmed: result.userConfirmed,
                            success: true,
                        });
                    }
                },
            );
        });
    }

    updateAttributes(email: string, updates: CognitoUserAttribute[]) {
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool,
        });

        user.updateAttributes(updates, () => {});
    }

    async authenticate(user: AuthenticateRequestDto) {
        const { username, password } = user;
        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });
        const userData = {
            Username: username,
            Pool: this.userPool,
        };
        const newUser = new CognitoUser(userData);
        return await new Promise((resolve, reject) => {
            newUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    resolve({
                        accessToken: result.getIdToken().getJwtToken(),
                        refreshToken: result.getRefreshToken().getToken(),
                        userId: result.getIdToken().payload.sub,
                        email: result.getIdToken().payload.email,
                        name: result.getIdToken().payload.name,
                    });
                },
                onFailure: (err) => {
                    reject(err);
                },
            });
        });
    }

    async confirmUser(userData: ConfirmUserRequestDto) {
        const user = new CognitoUser({
            Username: userData.username,
            Pool: this.userPool,
        });
        return await new Promise((resolve, reject) => {
            user.confirmRegistration(userData.code, false, (err, result) => {
                if (!result) {
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            });
        });
    }

    async forget(forgetPasswordRequest: ForgetRequestDto) {
        const { email } = forgetPasswordRequest;
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool,
        });
        return await new Promise((resolve, reject) => {
            user.forgotPassword({
                onSuccess: () => {
                    resolve({ success: true });
                },
                onFailure: (err) => {
                    reject(err);
                },
            });
        });
    }

    async reset(resetPasswordRequest: ResetRequestDto) {
        const { email, password, code } = resetPasswordRequest;
        const user = new CognitoUser({
            Username: email,
            Pool: this.userPool,
        });
        return await new Promise((resolve, reject) => {
            user.confirmPassword(code, password, {
                onSuccess: () => {
                    resolve({ success: true });
                },
                onFailure: (err) => {
                    reject(err);
                },
            });
        });
    }

    async refreshUserSession(userData: RefreshUserSessionRequestDto) {
        const user = new CognitoUser({
            Username: userData.username,
            Pool: this.userPool,
        });
        return await new Promise((resolve, reject) => {
            const refreshToken = new CognitoRefreshToken({
                RefreshToken: userData.refreshToken,
            });
            user.refreshSession(refreshToken, (err, result) => {
                if (!result) {
                    reject(err);
                } else {
                    resolve({
                        success: true,
                        refreshToken: result.getRefreshToken().getToken(),
                        accessToken: result.getAccessToken().getJwtToken(),
                    });
                }
            });
        });
    }
}
