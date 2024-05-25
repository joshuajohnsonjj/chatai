import {
    ChatType,
    DataSourceCategory,
    DataSourceTypeName,
    DataSyncInterval,
    EntityType,
    InternalAPIKeyScope,
    PrismaClient,
    UserType,
} from '@prisma/client';
import { seedMessages, seedThreads } from './messagesSeedData';

const prisma = new PrismaClient();
async function main() {
    await prisma.accountPlan.createMany({
        data: [
            {
                id: '40c5795b-33fe-451c-a84f-d10af743bbda',
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

    await prisma.dataSourceType.createMany({
        data: [
            {
                name: DataSourceTypeName.FILE_UPLOAD,
                category: DataSourceCategory.OTHER,
                requiredCredentialTypes: ['secret'],
            },
            {
                name: DataSourceTypeName.SLACK,
                category: DataSourceCategory.COMMUNICATION,
                requiredCredentialTypes: ['secret'],
            },
            {
                id: '02a83623-ffce-4218-82a7-fe7d705a23c2',
                name: DataSourceTypeName.NOTION,
                category: DataSourceCategory.NOTE_TAKING,
                requiredCredentialTypes: ['secret'],
            },
            {
                name: DataSourceTypeName.GOOGLE_DRIVE,
                category: DataSourceCategory.OTHER,
                requiredCredentialTypes: ['secret'],
            },
        ],
    });

    await prisma.dataSource.createMany({
        data: [
            {
                id: 'f0967a92-d948-4334-8751-cf586856a149',
                dataSourceTypeId: '02a83623-ffce-4218-82a7-fe7d705a23c2',
                ownerEntityId: '74284498-0011-7023-fc9c-67ab0f1e0a90',
                ownerEntityType: EntityType.INDIVIDUAL,
                secret: 'RbpMDiBN38ZFvT3QV7hrLTG1VGTF6RTJOAthw/9hd1B8yDVV0h34qyH2oQ6rMZRrAUDiSo7CNlanK/5aOuaYaAXxMF/+wZMfWGwpWlckGlF4uM8mq6YszuU9rx6LCUvFPWy4rGnKKqI0cbhJPKF8XWt6LnggPA0ppyF4uG4gDfCfDFnqUthP/PI8hmbl/eKWK3WclwzVMwO1IaP0GSTo6VUi3v6ODCSDWCHZ6KQSL2hoZGMBCp8XabmTaQXd+OVAPlz6JGh7f3fSz+ywVgzuEUWjw8sYNBNlJMaz920x+1YsWe4fk0lOrNtK6+MxBY5CgUBW1W/KiRhjZ489kjFGtQ==',
            },
        ],
    });

    await prisma.user.createMany({
        data: [
            {
                id: '74284498-0011-7023-fc9c-67ab0f1e0a90',
                type: UserType.INDIVIDUAL,
                planId: '40c5795b-33fe-451c-a84f-d10af743bbda',
                email: 'joshuajohnsonjj38@gmail.com',
                firstName: 'Joshua',
                lastName: 'Johnson',
                stripeCustomerId: 'cus_Pwe9PbMP6aZArt',
            },
        ],
    });

    await prisma.entitySettings.createMany({
        data: [
            {
                id: '74283398-0021-7023-fc9b-67a1bg1e0a11',
                createdAt: '2024-05-10T00:43:32.621Z',
                updatedAt: '2024-05-10T00:43:32.621Z',
                newsletterNotification: true,
                usageNotification: true,
                chatCreativity: 7,
                chatMinConfidence: 7,
                chatTone: 'DEFAULT',
                baseInstructions: null,
                associatedUserId: '74284498-0011-7023-fc9c-67ab0f1e0a90',
                associatedOrganizationId: null,
            },
        ],
    });

    await prisma.chat.createMany({
        data: [
            {
                id: '91d7c0cd-6e06-4721-8483-a6b547142cd1',
                userId: '74284498-0011-7023-fc9c-67ab0f1e0a90',
                title: 'Lil boii chat yo',
                chatType: ChatType.SYSTEM,
                associatedEntityId: '74284498-0011-7023-fc9c-67ab0f1e0a90',
            },
        ],
    });

    await prisma.chatMessageThread.createMany({ data: seedThreads });

    await prisma.chatMessage.createMany({ data: seedMessages });

    await prisma.internalAPIKey.createMany({
        data: [{
            key: 'usuovSN4kSceU9DEXjxT9ysQA100AK5sfA59Obd8tKRF9YClYbg2ex8WhZxnIrZTDbfUA4qH8NEfDXvbXgAbtAdWtJhcB8OjWuzM9Xq5GT7BiBGaYXWLwJY5ePffC9q4',
            isDisabled: false,
            scopes: [InternalAPIKeyScope.DATA_SOURCE],
        }],
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
