import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '../../lib/dataSources/notion';
import type {
    NotionBlock,
    NotionBlockDetailResponse,
    NotionTable,
    NotionAuthorAttribution,
} from '../../lib/dataSources/notion';
import type { Handler, SQSEvent } from 'aws-lambda';
import {
    collectAllChildren,
    getTextFromBlock,
    getTextFromTable,
    isNewLineBlock,
    isValidMessageBody,
    publishBlockData,
    shouldConnectToCurrentBlockGroup,
} from './utility';
import { decryptData } from '../../lib/descryption';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { COMPLETE_DATA_SOURCE_SYNC_ENDPOINT } from './constants';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import type { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { type CachedUser } from './types';

dotenv.config({ path: __dirname + '/../../../../.env' });

const entityStorageUsageMap: { [dataSourceId: string]: number } = {};

const notionAuthors: { [notionUserId: string]: CachedUser } = {};

const getBlockAuthor = async (
    notionAPI: NotionWrapper,
    author?: NotionAuthorAttribution,
): Promise<CachedUser | null> => {
    if (!author || author.object !== 'user') {
        return null;
    }

    const cached = notionAuthors[author.id];
    if (cached && cached.name && cached.email) {
        return notionAuthors[author.id];
    } else if (cached) {
        return null;
    }

    const userInfo = await notionAPI.getUserInfo(author.id);
    notionAuthors[author.id] = {
        name: userInfo.name,
        email: userInfo.person.email,
    };
    return notionAuthors[author.id];
};

/**
 * The objective here is to break down Notion page content into
 * pieces that are small enough to be stored/looked up effeciently, but
 * not too small so as to cut off too much context for the embedding
 * model to properly evaluate.
 *
 * Below we will always keep all table and columns content together as one
 * entry. Block types listed in JoinableBlockTypes will be kept together as
 * one entry until a newline or new heading element is detected of matching
 * weight.
 */
const processBlockList = async (
    mongo: MongoDBService,
    notionAPI: NotionWrapper,
    blocks: NotionBlock[],
    entityId: string,
    pageUrl: string,
    pageTitle: string,
    dataSourceId: string,
) => {
    let builtBlocksTextString = '';
    let connectedBlocks: NotionBlock[] = []; // TODO: problably dont need whole obj? ineficient memeory...

    for (const parentBlock of blocks) {
        if (parentBlock.in_trash) {
            // TODO: check if we have this data saved and remove it
            continue;
        } else if (
            (!ImportableBlockTypes.includes(parentBlock.type) || isNewLineBlock(parentBlock)) &&
            connectedBlocks.length
        ) {
            const author = await getBlockAuthor(notionAPI, connectedBlocks[0].last_edited_by);
            await publishBlockData(
                mongo,
                builtBlocksTextString,
                connectedBlocks[0],
                pageTitle,
                pageUrl,
                entityId,
                author,
                entityStorageUsageMap,
                dataSourceId,
            );
            builtBlocksTextString = '';
            connectedBlocks = [];
            continue;
        } else if (!ImportableBlockTypes.includes(parentBlock.type) || isNewLineBlock(parentBlock)) {
            continue;
        } else if (!shouldConnectToCurrentBlockGroup(connectedBlocks, parentBlock)) {
            const author = await getBlockAuthor(notionAPI, connectedBlocks[0]?.last_edited_by);
            await publishBlockData(
                mongo,
                builtBlocksTextString,
                connectedBlocks[0],
                pageTitle,
                pageUrl,
                entityId,
                author,
                entityStorageUsageMap,
                dataSourceId,
            );
            builtBlocksTextString = '';
            connectedBlocks = [];
        }

        if (parentBlock.type === NotionBlockType.TABLE) {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            const aggregatedBlockText = getTextFromTable(
                aggregatedNestedBlocks.slice(1),
                parentBlock[parentBlock.type] as NotionTable,
            );
            await publishBlockData(
                mongo,
                aggregatedBlockText,
                parentBlock,
                pageTitle,
                pageUrl,
                entityId,
                null,
                entityStorageUsageMap,
                dataSourceId,
            );
        } else if (parentBlock.type === NotionBlockType.COLUMN_LIST) {
            const columnBlocks = await notionAPI.listPageBlocks(parentBlock.id, null);
            await Promise.all(
                columnBlocks.results.map(async (columnBlockParent: NotionBlock) => {
                    const columnNestedBlocks = await collectAllChildren(columnBlockParent, notionAPI);
                    const aggregatedBlockText = columnNestedBlocks
                        .slice(1)
                        .map((block) => getTextFromBlock(block))
                        .join('\n');
                    const author = await getBlockAuthor(notionAPI, columnBlockParent.last_edited_by);
                    await publishBlockData(
                        mongo,
                        aggregatedBlockText,
                        columnBlockParent,
                        pageTitle,
                        pageUrl,
                        entityId,
                        author,
                        entityStorageUsageMap,
                        dataSourceId,
                    );
                }),
            );
        } else {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            builtBlocksTextString += aggregatedNestedBlocks.map((block) => getTextFromBlock(block)).join('\n');
            builtBlocksTextString += '. ';
            connectedBlocks.push(parentBlock);
        }
    }

    // publish anything else left at the end of traversal
    if (connectedBlocks.length) {
        const author = await getBlockAuthor(notionAPI, connectedBlocks[0].last_edited_by);
        await publishBlockData(
            mongo,
            builtBlocksTextString,
            connectedBlocks[0],
            pageTitle,
            pageUrl,
            entityId,
            author,
            entityStorageUsageMap,
            dataSourceId,
        );
    }
};

const processPage = async (
    mongo: MongoDBService,
    notionAPI: NotionWrapper,
    pageId: string,
    entityId: string,
    pageUrl: string,
    pageTitle: string,
    dataSourceId: string,
) => {
    let isComplete = false;
    let nextCursor: string | null = null;
    const blocks: NotionBlock[] = [];

    while (!isComplete) {
        const blockResponse: NotionBlockDetailResponse = await notionAPI.listPageBlocks(pageId, nextCursor);
        blocks.push(...blockResponse.results);
        isComplete = !blockResponse.has_more;
        nextCursor = blockResponse.next_cursor;
    }

    await processBlockList(mongo, notionAPI, blocks, entityId, pageUrl, pageTitle, dataSourceId);
};

/**
 * Lambda SQS handler
 *
 * Message body expected to have following data
 *      pageId: string,
 *      pageTitle: string,
 *      pageUrl: string,
 *      ownerEntityId: string,
 *      dataSourceId: string,
 *      secret: string,
 *      isFinal: true,
 */
export const handler: Handler = async (event: SQSEvent): Promise<{ success: true }> => {
    const mongo = await getMongoClientFromCacheOrInitiateConnection(
        process.env.MONGO_CONN_STRING as string,
        process.env.MONGO_DB_NAME as string,
    );

    // TODO: error handling, dead letter queue?
    const processingPagePromises: Promise<void>[] = [];
    const completedDataSources: string[] = [];

    console.log(`Processing ${event.Records.length} messages`);

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        if (!isValidMessageBody(messageBody)) {
            console.error('Skipping invalid message', messageBody);
            continue;
        }

        if (messageBody.isFinal) {
            completedDataSources.push(messageBody.dataSourceId);
        }

        const notionKey = decryptData(process.env.RSA_PRIVATE_KEY!, messageBody.secret);
        const notionAPI = new NotionWrapper(notionKey);

        processingPagePromises.push(
            processPage(
                mongo,
                notionAPI,
                messageBody.pageId,
                messageBody.ownerEntityId,
                messageBody.pageUrl,
                messageBody.pageTitle,
                messageBody.dataSourceId,
            ),
        );
    }

    await Promise.all(processingPagePromises);

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);

        await axios({
            method: 'patch',
            baseURL: process.env.INTERNAL_BASE_API_HOST!,
            url: COMPLETE_DATA_SOURCE_SYNC_ENDPOINT,
            data: {
                completed: completedDataSources.map((id) => ({
                    dataSourceId: id,
                    bytesDelta: entityStorageUsageMap[id] ?? 0,
                })),
            },
            headers: {
                'api-key': process.env.INTERNAL_API_KEY!,
            },
        });
    }

    return { success: true };
};
