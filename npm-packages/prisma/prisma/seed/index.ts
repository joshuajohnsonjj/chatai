import { ChatType, DataSourceTypeName, EntityType, PrismaClient, UserType } from '@prisma/client';
import { v4 } from 'uuid';

const prisma = new PrismaClient();
async function main() {
    // plans
    const accountPlan = await prisma.accountPlan.create({
        data: {
            name: 'Basic month-to-month',
            stripeId: 'xyz',
            isActive: true,
        },
    });

    // users
    const user = await prisma.user.create({
        data: {
            id: v4(),
            type: UserType.INDIVIDUAL,
            planId: accountPlan.id,
        },
    });

    // data source types
    await prisma.dataSourceType.createMany({
        data: [
            { name: DataSourceTypeName.FILE_UPLOAD },
            { name: DataSourceTypeName.SLACK },
            { name: DataSourceTypeName.GOOGLE_DRIVE },
            { name: DataSourceTypeName.NOTION },
        ],
    });

    const dataSourceType = await prisma.dataSourceType.findFirst({
        select: { id: true },
    });

    await prisma.dataSource.create({
        data: {
            lastSync: new Date(),
            dataSourceTypeId: dataSourceType?.id as string,
            ownerEntityId: user.id,
            ownerEntityType: EntityType.INDIVIDUAL,
            secret: 'SECRET_HASH',
        },
    });

    // chats
    await prisma.chat.create({
        data: {
            userId: user.id,
            chatType: ChatType.SLACK,
            title: 'Slack Chat',
        },
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
