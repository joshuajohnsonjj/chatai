import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/services/stripe';
import {
    GetUserInfoRequestDto,
    GetUserInfoResponseDto,
    SetProfileImageResponseDto,
    UpdateUserInfoRequestDto,
    UpdateUserSettingsRequestDto,
} from './dto/userInfo.dto';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';

@Injectable()
export class UserService {
    private readonly stripeService = new StripeService(this.configService.get<string>('STRIPE_KEY')!);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
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

    async uploadUserImage(imageBase64: string, user: DecodedUserTokenDto): Promise<SetProfileImageResponseDto> {
        const buf = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const data = {
            Key: user.idUser,
            Body: buf,
            ContentEncoding: 'base64',
            ContentType: 'image/jpeg',
        };
        // TODO: implement s3 upload
        // s3Bucket.putObject(data, function(err, data){
        //     if (err) {
        //         console.log(err);
        //         console.log('Error uploading data: ', data);
        //     } else {
        //         console.log('successfully uploaded the image!');
        //     }
        // });
        return { imageUrl: '' };
    }

    async updateUserSettings(payload: UpdateUserSettingsRequestDto, user: DecodedUserTokenDto): Promise<void> {
        await this.prisma.entitySettings.update({
            where: { associatedUserId: user.idUser },
            data: payload,
        });
    }
}
