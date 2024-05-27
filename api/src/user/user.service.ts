import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/services/stripe';
import { GetUserInfoRequestDto, GetUserInfoResponseDto } from './dto/userInfo.dto';
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
            where: {
                id: user.idUser,
            },
            include: {
                organization: options.includeOrg ?? true,
                plan: options.includeAccountPlan ?? true,
                settings: options.includeSettings ?? true,
            },
        });

        return userData;
    }
}
