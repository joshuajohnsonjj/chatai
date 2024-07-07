import { MongoDBService } from '@joshuajohnsonjj38/mongodb';

let cachedMongo: MongoDBService;

export const getMongoClientFromCacheOrInitiateConnection = async (
    connStr: string,
    dbName: string,
): Promise<MongoDBService> => {
    if (cachedMongo) {
        return cachedMongo;
    }

    cachedMongo = new MongoDBService(connStr, dbName);

    await cachedMongo.init();

    return cachedMongo;
};
