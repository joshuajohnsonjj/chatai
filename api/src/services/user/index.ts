import { STRIPE_PRODUCTS } from "src/constants/stripe";
import type { PrismaService } from "src/prisma/prisma.service";
import type { StripeService } from "../stripe";
import { UserType } from "@prisma/client";

export const createUserAndDependencies = async (
    userId: string,
    firstName: string,
    lastName: string,
    email: string,
    prismaClient: PrismaService,
    stripeClient: StripeService,
    photoUrl?: string,
): Promise<void> => {
    const [accountPlan, stripeCustomer] = await Promise.all([
        prismaClient.accountPlan.findUniqueOrThrow({
            where: { stripeProductId: STRIPE_PRODUCTS.INDIVIDUAL_STARTER },
        }),
        stripeClient.createCustomer(`${firstName} ${lastName}`, email),
    ]);

    await prismaClient.user.create({
        data: {
            id: userId,
            firstName,
            lastName,
            email,
            stripeCustomerId: stripeCustomer.id,
            type: UserType.INDIVIDUAL,
            planId: accountPlan.id,
            photoUrl,
        },
    });

    await prismaClient.entitySettings.create({
        data: { associatedUserId: userId },
    });
};
