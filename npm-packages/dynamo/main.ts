import { DynamoDB } from 'aws-sdk';
import { DeleteItemOutput, GetItemOutput, PutItemOutput, QueryOutput } from 'aws-sdk/clients/dynamodb';
import { DynamoAttributes, DynamoDataStoreDocument, DynamoTables } from './types';

export class DynamoDBClient {
    private readonly client: DynamoDB.DocumentClient;

    private readonly table = DynamoTables.ImportsDataStore;

    constructor(accessKeyId: string, secretAccessKey: string, region: string) {
        this.client = new DynamoDB.DocumentClient({
            apiVersion: '2012-11-05',
            accessKeyId,
            secretAccessKey,
            region,
        });
    }

    public async queryByAttr(attributeName: DynamoAttributes, attributeValue: string): Promise<QueryOutput> {
        const params = {
            ExpressionAttributeNames: {
                [`#${attributeName}`]: attributeName,
            },
            ExpressionAttributeValues: {
                [`:${attributeName}`]: attributeValue,
            },
            FilterExpression: `#${attributeName} = :${attributeName}`,
            TableName: this.table,
        };
        return this.client.query(params).promise();
    }

    public async getItemById(documentId: string): Promise<GetItemOutput> {
        const params = {
            TableName: this.table,
            Key: { [DynamoAttributes.ID]: documentId },
        };

        return this.client.get(params).promise();
    }

    public async batchGetByIds(documentIds: string[]): Promise<DynamoDB.DocumentClient.BatchGetItemOutput> {
        const queryParams = {
            RequestItems: {
                [this.table]: {
                    Keys: documentIds.map((id) => ({ id: {S: id }})),
                },
            },
        };

        return this.client.batchGet(queryParams).promise();
    }

    public async putItem(item: DynamoDataStoreDocument): Promise<PutItemOutput> {
        const params = {
            TableName: this.table,
            Item: item,
        };
        return this.client.put(params).promise();
    }

    public async deleteItemById(documentId: string): Promise<DeleteItemOutput> {
        const params = {
            TableName: this.table,
            Key: {
                [DynamoAttributes.ID]: documentId,
            },
        };
        return this.client.delete(params).promise();
    }
}
