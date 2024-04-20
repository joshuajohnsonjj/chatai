import { DynamoAttributes, DynamoDataStoreDocument, DynamoTables } from './types';
import {
    BatchGetItemCommand,
    DeleteItemCommand,
    DeleteItemCommandOutput,
    DynamoDBClient,
    PutItemCommand,
    PutItemCommandOutput,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';

export class DynamoClient {
    private readonly client: DynamoDBClient;

    private readonly table = DynamoTables.ImportsDataStore;

    constructor(region: string) {
        this.client = new DynamoDBClient({
            region,
        });
    }

    public async queryByAttr(
        attributeName: DynamoAttributes,
        attributeValue: string,
        id: string,
    ): Promise<DynamoDataStoreDocument[]> {
        const input = {
            TableName: this.table,
            ExpressionAttributeValues: {
                ':value': { S: attributeValue },
                ':id': { S: id },
            },
            KeyConditionExpression: `${DynamoAttributes.ID} = :id`,
            FilterExpression: `#${attributeName} = :value`,
            ExpressionAttributeNames: {
                [`#${attributeName}`]: attributeName,
            },
        };

        const queryRes = await this.client.send(new QueryCommand(input));
        const queryItems = queryRes.Items ?? [];

        if (!queryItems.length) {
            return [];
        }

        return queryItems.map((item) =>
            Object.fromEntries(Object.entries(item).map(([key, val]) => [key, val.S])),
        ) as unknown as DynamoDataStoreDocument[];
    }

    public async getItemById(documentId: string): Promise<DynamoDataStoreDocument | null> {
        const input = {
            TableName: this.table,
            ExpressionAttributeValues: {
                ':id': { S: documentId },
            },
            KeyConditionExpression: `${DynamoAttributes.ID} = :id`,
        };

        const queryRes = await this.client.send(new QueryCommand(input));
        const queryItems = queryRes.Items ?? [];

        if (!queryItems.length) {
            return null;
        }

        return Object.fromEntries(
            Object.entries(queryItems[0]).map(([key, val]) => [key, val.S]),
        ) as unknown as DynamoDataStoreDocument;
    }

    public async batchGetByIds(documentIds: string[]): Promise<DynamoDataStoreDocument[]> {
        const input = {
            RequestItems: {
                [this.table]: {
                    Keys: documentIds.map((id) => ({ id: { S: id } })),
                },
            },
        };

        const queryRes = await this.client.send(new BatchGetItemCommand(input));

        if (!queryRes.Responses || !queryRes.Responses[this.table].length) {
            return [];
        }

        return queryRes.Responses[this.table].map((item) =>
            Object.fromEntries(Object.entries(item).map(([key, val]) => [key, val.S])),
        ) as unknown as DynamoDataStoreDocument[];
    }

    public async putItem(item: DynamoDataStoreDocument): Promise<PutItemCommandOutput> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        Object.entries(item).forEach(([key, val]: string[]) => {
            data[key] = { S: val };
        });
        const input = {
            TableName: this.table,
            Item: data,
        };

        return this.client.send(new PutItemCommand(input));
    }

    public async deleteItemById(documentId: string): Promise<DeleteItemCommandOutput> {
        const input = {
            TableName: this.table,
            Key: {
                [DynamoAttributes.ID]: { S: documentId },
            },
            ExpressionAttributeValues: {
                ':id': { S: documentId },
            },
            KeyConditionExpression: `${DynamoAttributes.ID} = :id`,
        };

        return this.client.send(new DeleteItemCommand(input));
    }
}
