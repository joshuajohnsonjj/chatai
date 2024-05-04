import { MongoDBService } from '@joshuajohnsonjj38/mongodb';

let cachedMongo: MongoDBService;
export const getMongoClientFromCacheOrInitiateConnection = async (
    connStr: string,
    dbName: string,
): Promise<MongoDBService> => {
    if (cachedMongo) {
        return cachedMongo;
    }

    const mongo = new MongoDBService(connStr, dbName);
    await mongo.init();
    cachedMongo = mongo;
    return cachedMongo;
};
