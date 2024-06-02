import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/services/stripe';
import {
    GetUserInfoRequestDto,
    GetUserInfoResponseDto,
    UpdateUserInfoRequestDto,
    UpdateUserSettingsRequestDto,
} from './dto/userInfo.dto';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';
import { LoggerContext } from 'src/constants';
import { InternalError } from 'src/exceptions';

@Injectable()
export class UserService {
    private readonly stripeService = new StripeService(this.configService.get<string>('STRIPE_KEY')!);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly logger: Logger,
    ) {}

    async getUserInfo(options: GetUserInfoRequestDto, user: DecodedUserTokenDto): Promise<GetUserInfoResponseDto> {
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
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.idUser },
                data: payload,
            });

            // TODO: update cognito
        });
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
        await this.prisma.entitySettings.update({
            where: { associatedUserId: user.idUser },
            data: payload,
        });
    }
}
