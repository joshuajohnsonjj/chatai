import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/services/stripe';
import {
    GetUserInfoRequestDto,
    GetUserInfoResponseDto,
    UpdateUserInfoRequestDto,
    UpdateUserSettingsRequestDto,
} from './dto/userInfo.dto';
import { DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';
import { LoggerContext } from 'src/constants';
import { InternalError } from 'src/exceptions';
import { AuthService } from 'src/auth/auth.service';
import { omit } from 'lodash';

@Injectable()
export class UserService {
    @Inject(AuthService)
    private readonly AuthService: AuthService;

    private readonly stripeService = new StripeService(this.configService.get<string>('STRIPE_KEY')!);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
    ) {}

    async getUserInfo(options: GetUserInfoRequestDto, user: DecodedUserTokenDto): Promise<GetUserInfoResponseDto> {
        this.logger.log(`Retreiving info for user ${user.idUser}`, LoggerContext.USER);

        const userData = this.prisma.user.findUniqueOrThrow({
            where: { id: user.idUser },
            include: {
                organization: options.includeOrg ?? true,
                plan: options.includeAccountPlan ?? true,
                settings: options.includeSettings ?? true,
            },
        });

        return userData;
    }

    async updateUserData(payload: UpdateUserInfoRequestDto, user: DecodedUserTokenDto): Promise<void> {
        this.logger.log(
            `Updating data for user ${user.idUser}: ${JSON.stringify(omit(payload, ['accessToken']))}`,
            LoggerContext.USER,
        );

        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: user.idUser },
                    data: omit(payload, ['accessToken']),
                });

                if (payload.email) {
                    await this.AuthService.updateEmail(payload.accessToken, payload.email);
                }
            });
        } catch (e) {
            this.logger.error(e.message, e.stack, LoggerContext.USER);
            throw new InternalError(e.message);
        }
    }

    async uploadUserImage(
        imageBase64: string,
        fileType: string,
        user: DecodedUserTokenDto,
    ): Promise<{
        imageUrl: string;
    }> {
        this.logger.log(`Starting profile image upload for user ${user.idUser}`, LoggerContext.USER);

        const s3Client = new S3Client({ region: this.configService.get<string>('AWS_REGION')! });

        const buf = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const fileKey = `${user.idUser}.avatar`;
        const uploadParams = {
            Bucket: this.configService.get<string>('S3_USER_AVATAR_BUCKET')!,
            Key: fileKey,
            Body: buf,
            ContentEncoding: 'base64',
            ContentType: fileType,
        };

        try {
            const data = await s3Client.send(new PutObjectCommand(uploadParams));
            this.logger.log(`Successfully uploaded image to S3: ${JSON.stringify(data)}`, LoggerContext.USER);
        } catch (error) {
            this.logger.error(`failed to upload image to S3: ${error.message}`, error.stack, LoggerContext.USER);
            throw new InternalError('Image upload failed');
        }

        const imageUrl = `https://${this.configService.get<string>('S3_USER_AVATAR_BUCKET')!}.s3.amazonaws.com/${fileKey}`;

        await this.prisma.user.update({
            where: { id: user.idUser },
            data: { photoUrl: imageUrl },
        });

        return { imageUrl };
    }

    async updateUserSettings(payload: UpdateUserSettingsRequestDto, user: DecodedUserTokenDto): Promise<void> {
        this.logger.log(`Updating settings for user ${user.idUser}: ${JSON.stringify(payload)}`, LoggerContext.USER);

        await this.prisma.entitySettings.update({
            where: { associatedUserId: user.idUser },
            data: payload,
        });
    }
}
