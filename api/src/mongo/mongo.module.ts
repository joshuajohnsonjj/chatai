import { Module } from '@nestjs/common';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';

@Module({
    providers: [
        {
            provide: 'MONGO_DB_CONNECTION',
            useFactory: async (): Promise<MongoDBService> => {
                const client = new MongoDBService(
                    process.env.MONGO_DB_CONN_STRING as string,
                    process.env.MONGO_DB_NAME as string,
                );
                await client.init();
                return client;
            },
        },
    ],
    exports: ['MONGO_DB_CONNECTION'],
})
export class MongoModule {}
