import { Injectable } from '@nestjs/common';
import {
	AuthenticationDetails,
	CognitoRefreshToken,
	CognitoUser,
	CognitoUserAttribute,
	CognitoUserPool
} from 'amazon-cognito-identity-js';
import { ConfigService } from '@nestjs/config';
import { type RegisterRequestDto } from './dto/register.request.dto';
import { type AuthenticateRequestDto } from './dto/authenticate.request.dto';
import { type ConfirmUserRequestDto } from './dto/confirm.request.dto';
import { type RefreshUserSessionRequestDto } from './dto/refresh.request.dto';
import { type ForgetRequestDto } from './dto/forget.request.dto';
import { type ResetRequestDto } from './dto/reset.request.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserAuthService {
	private readonly userPool: CognitoUserPool;

	constructor (private readonly configService: ConfigService, private readonly prisma: PrismaService) {
		this.userPool = new CognitoUserPool({
			UserPoolId: this.configService.get<string>('AWS_COGNITO_USER_POOL_ID') as string,
			ClientId: this.configService.get<string>('AWS_COGNITO_CLIENT_ID') as string,
		});
	}

	async forget (forgetPasswordRequest: ForgetRequestDto) {
		const { email } = forgetPasswordRequest;
		const user = new CognitoUser({
			Username: email,
			Pool: this.userPool
		});
		return await new Promise((resolve, reject) => {
			user.forgotPassword({
				onSuccess: () => {
					resolve({ success: true });
				},
				onFailure: (err) => {
					reject(err);
				}
			});
		});
	}

	async reset (resetPasswordRequest: ResetRequestDto) {
		const { email, password, code } = resetPasswordRequest;
		const user = new CognitoUser({
			Username: email,
			Pool: this.userPool
		});
		return await new Promise((resolve, reject) => {
			user.confirmPassword(code, password, {
				onSuccess: () => {
					resolve({ success: true });
				},
				onFailure: (err) => {
					reject(err);
				}
			});
		});
	}

	async register (authRegisterRequest: RegisterRequestDto) {
		const { firstName, lastName, email, password, phoneNumber, type } = authRegisterRequest;
		return await new Promise((resolve, reject) => {
			this.userPool.signUp(
				email,
				password,
				[
					new CognitoUserAttribute({ Name: 'firstName', Value: firstName }),
					new CognitoUserAttribute({ Name: 'lastName', Value: lastName || '' }),
					new CognitoUserAttribute({ Name: 'phoneNumber', Value: phoneNumber || '' })
				],
				[],
				async (err, result) => {
					if (!result) {
						reject(err);
					} else {
						const userId = result.userSub;

						await this.prisma.user.create({
							data: {
								id: userId,
								type
							}
						});

						resolve({
							uuid: userId,
							userConfirmed: result.userConfirmed,
							success: true
						});
					}
				}
			);
		});
	}

	async authenticate (user: AuthenticateRequestDto) {
		const { username, password } = user;
		const authenticationDetails = new AuthenticationDetails({
			Username: username,
			Password: password
		});
		const userData = {
			Username: username,
			Pool: this.userPool
		};
		const newUser = new CognitoUser(userData);
		return await new Promise((resolve, reject) => {
			newUser.authenticateUser(authenticationDetails, {
				onSuccess: (result) => {
					resolve({
						accessToken: result.getAccessToken().getJwtToken(),
						refreshToken: result.getRefreshToken().getToken(),
						userId: result.getAccessToken().payload.username,
						email: result.getIdToken().payload.email,
						name: result.getIdToken().payload.name
					});
				},
				onFailure: (err) => {
					reject(err);
				}
			});
		});
	}

	async confirmUser (userData: ConfirmUserRequestDto) {
		const user = new CognitoUser({
			Username: userData.username,
			Pool: this.userPool
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

	async refreshUserSession (userData: RefreshUserSessionRequestDto) {
		const user = new CognitoUser({
			Username: userData.username,
			Pool: this.userPool
		});
		return await new Promise((resolve, reject) => {
			const refreshToken = new CognitoRefreshToken({
				RefreshToken: userData.refreshToken
			});
			user.refreshSession(refreshToken, (err, result) => {
				if (!result) {
					reject(err);
				} else {
					resolve({
						success: true,
						refreshToken: result.getRefreshToken().getToken(),
						accessToken: result.getAccessToken().getJwtToken()
					});
				}
			});
		});
	}
}
