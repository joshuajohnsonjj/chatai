import { DynamoAttributes, DynamoDataStoreDocument, DynamoTables } from './types';
import {
    BatchGetItemCommand,
    BatchGetItemCommandOutput,
    DeleteItemCommand,
    DeleteItemCommandOutput,
    DynamoDBClient,
    PutItemCommand,
    PutItemCommandOutput,
    QueryCommand,
    QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';

export class DynamoClient {
    private readonly client: DynamoDBClient;

    private readonly table = DynamoTables.ImportsDataStore;

    constructor(region: string) {
        this.client = new DynamoDBClient({
            region,
        });
    }

    public async queryByAttr(attributeName: DynamoAttributes, attributeValue: string): Promise<QueryCommandOutput> {
        const input = {
            TableName: this.table,
            ExpressionAttributeValues: {
                ':v1': {
                    S: attributeValue,
                },
            },
            KeyConditionExpression: `${attributeName} = :v1`,
        };

        return this.client.send(new QueryCommand(input));
    }

    public async getItemById(documentId: string): Promise<QueryCommandOutput> {
        const input = {
            TableName: this.table,
            ExpressionAttributeValues: {
                ':v1': {
                    S: documentId,
                },
            },
            KeyConditionExpression: `${DynamoAttributes.ID} = :v1`,
        };

        return this.client.send(new QueryCommand(input));
    }

    public async batchGetByIds(documentIds: string[]): Promise<BatchGetItemCommandOutput> {
        const input = {
            RequestItems: {
                [this.table]: {
                    Keys: documentIds.map((id) => ({ id: { S: id } })),
                },
            },
        };

        return this.client.send(new BatchGetItemCommand(input));
    }

    public async putItem(item: DynamoDataStoreDocument): Promise<PutItemCommandOutput> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        Object.values(item).forEach(([key, val]: string[]) => {
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
        };

        return this.client.send(new DeleteItemCommand(input));
    }
}
