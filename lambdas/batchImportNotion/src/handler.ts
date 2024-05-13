import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
import type { NotionBlock, NotionBlockDetailResponse, NotionTable, NotionAuthorAttribution } from '@joshuajohnsonjj38/notion';
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
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { COMPLETE_DATA_SOURCE_SYNC_ENDPOINT } from './constants';
import { getMongoClientFromCacheOrInitiateConnection } from '../../lib/mongoCache';
import type { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { type CachedUser } from './types';

dotenv.config({ path: __dirname + '/../../../../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);

const notionAuthors: { [notionUserId: string]: CachedUser } = {};
const getBlockAuthor = async (notionAPI: NotionWrapper, author: NotionAuthorAttribution): Promise<CachedUser | null> => {
    if (author.object !== 'user') {
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
) => {
    let builtBlocksTextString = '';
    let connectedBlocks: NotionBlock[] = [];

    for (const parentBlock of blocks) {
        if (parentBlock.in_trash) {
            // TODO: check if we have this data saved and remove it
            continue;
        } else if (!ImportableBlockTypes.includes(parentBlock.type) || isNewLineBlock(parentBlock)) {
            if (!connectedBlocks.length) {
                continue;
            }

            // if we hit a block type that is not in importable list or a newline and our current
            // block list is non empty, publish this group
            const author = await getBlockAuthor(notionAPI, connectedBlocks[0].last_edited_by);
            await publishBlockData(mongo, builtBlocksTextString, connectedBlocks[0], pageTitle, pageUrl, entityId, author);
            builtBlocksTextString = '';
            connectedBlocks = [];
            continue;
        } else if (!shouldConnectToCurrentBlockGroup(connectedBlocks, parentBlock)) {
            if (!connectedBlocks.length) {
                continue;
            }

            const author = await getBlockAuthor(notionAPI, connectedBlocks[0].last_edited_by);
            await publishBlockData(mongo, builtBlocksTextString, connectedBlocks[0], pageTitle, pageUrl, entityId, author);
            builtBlocksTextString = '';
            connectedBlocks = [];
        }

        // For tables and column lists, always traverse the whole thing to publish all importable content as one
        if (parentBlock.type === NotionBlockType.TABLE) {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            const aggregatedBlockText = getTextFromTable(
                aggregatedNestedBlocks.slice(1),
                parentBlock[parentBlock.type] as NotionTable,
            );
            const author = await getBlockAuthor(notionAPI, parentBlock.last_edited_by);
            await publishBlockData(mongo, aggregatedBlockText, parentBlock, pageTitle, pageUrl, entityId, author);
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
                    await publishBlockData(mongo, aggregatedBlockText, columnBlockParent, pageTitle, pageUrl, entityId, author);
                }),
            );
        } else {
            // if not table or column list get children of current block and continue traversing page
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            builtBlocksTextString += aggregatedNestedBlocks.map((block) => getTextFromBlock(block)).join('\n');
            builtBlocksTextString += '. ';
            connectedBlocks.push(parentBlock);
        }
    }

    // publish anything else left at the end of traversal
    if (connectedBlocks.length) {
        console.log(6)
        const author = await getBlockAuthor(notionAPI, connectedBlocks[0].last_edited_by);
        await publishBlockData(mongo, builtBlocksTextString, connectedBlocks[0], pageTitle, pageUrl, entityId, author);
    }
};

const processPage = async (
    mongo: MongoDBService,
    notionAPI: NotionWrapper,
    pageId: string,
    entityId: string,
    pageUrl: string,
    pageTitle: string,
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

    await processBlockList(mongo, notionAPI, blocks, entityId, pageUrl, pageTitle);
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

        const notionKey = rsaService.decrypt(messageBody.secret);
        const notionAPI = new NotionWrapper(notionKey);

        processingPagePromises.push(
            processPage(
                mongo,
                notionAPI,
                messageBody.pageId,
                messageBody.ownerEntityId,
                messageBody.pageUrl,
                messageBody.pageTitle,
            ),
        );
    }

    await Promise.all(processingPagePromises);

    if (completedDataSources.length) {
        console.log('Sync completed of data source records:', completedDataSources);

        // TODO: fill in host env once first live deployment happens
        // await axios({
        //     method: 'patch',
        //     baseURL: process.env.BASE_API_HOST,
        //     url: COMPLETE_DATA_SOURCE_SYNC_ENDPOINT,
        //     data: {
        //         dataSourceIds: completedDataSources,
        //     },
        // });
    }

    console.log('DONE');
    return { success: true };
};
