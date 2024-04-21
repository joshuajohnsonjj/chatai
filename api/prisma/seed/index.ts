import { DataSyncInterval, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
    await prisma.accountPlan.createMany({
        data: [
            {
                stripeProductId: 'prod_Pv7gSv8MIwbXzn',
                maxDataSources: 5,
                dataSyncInterval: DataSyncInterval.INSTANT,
                adHocUploadsEnabled: true,
                integrationsEnabled: true,
            },
            {
                stripeProductId: 'prod_Pv7unqUI418jsP',
                maxDataSources: 5,
                dataSyncInterval: DataSyncInterval.INSTANT,
                adHocUploadsEnabled: true,
                integrationsEnabled: true,
            },
        ],
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
