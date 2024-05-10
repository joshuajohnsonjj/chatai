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
        const organizationSelect =
            options.includeOrg ?? true
                ? {
                      select: {
                          id: true,
                          planId: true,
                          isAccountActive: true,
                          name: true,
                      },
                  }
                : false;

        const accountPlanSelect =
            options.includeAccountPlan ?? true
                ? {
                      select: {
                          isActive: true,
                          adHocUploadsEnabled: true,
                          dailyMessageQuota: true,
                          dataSyncInterval: true,
                          integrationsEnabled: true,
                          maxDataSources: true,
                          stripeProductId: true,
                      },
                  }
                : false;

        const settingsSelect =
            options.includeSettings ?? true
                ? {
                      select: {
                          newsletterNotification: true,
                          usageNotification: true,
                          chatCreativity: true,
                          chatMinConfidence: true,
                          chatTone: true,
                          baseInstructions: true,
                      },
                  }
                : false;

        const userData = this.prisma.user.findUniqueOrThrow({
            where: {
                id: user.idUser,
            },
            select: {
                id: true,
                createdAt: true,
                updatedAt: true,
                type: true,
                planId: true,
                organizationId: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                stripeCustomerId: true,
                organization: organizationSelect,
                plan: accountPlanSelect,
                settings: settingsSelect,
            },
        });

        return userData;
    }
}
