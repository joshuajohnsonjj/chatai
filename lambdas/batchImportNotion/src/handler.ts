import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
import type { NotionBlock, NotionBlockDetailResponse, NotionSQSBaseBody, NotionTable } from '@joshuajohnsonjj38/notion';
import type { Handler } from 'aws-lambda';
import {
    collectAllChildren,
    getTextFromBlock,
    getTextFromTable,
    isNewLineBlock,
    publishBlockData,
    shouldConnectToCurrentBlockGroup,
} from './utility';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);

/**
 * The objective here is to break down Notion content page content into
 * pieces that are small enough to be stored/looked up effeciently, but
 * not too small so as to cut off important context for the embedding
 * model to properly evaluate.
 *
 * Below we will always keep all table and columns content together as one
 * entry. Block types listed in JoinableBlockTypes will be kept together as
 * one entry until a newline or new heading element is detected of matching
 * weight.
 */
const processBlockList = async (
    notionAPI: NotionWrapper,
    blocks: NotionBlock[],
    ownerId: string,
    pageUrl: string,
    pageTitle: string,
) => {
    let builtBlocksTextString = '';
    let connectedBlocks: NotionBlock[] = [];

    for (const parentBlock of blocks) {
        if (parentBlock.in_trash) {
            continue;
        } else if (
            (!ImportableBlockTypes.includes(parentBlock.type) || isNewLineBlock(parentBlock)) &&
            connectedBlocks.length
        ) {
            await publishBlockData(builtBlocksTextString, connectedBlocks[0], pageTitle, pageUrl, ownerId);
            builtBlocksTextString = '';
            connectedBlocks = [];
            continue;
        } else if (!ImportableBlockTypes.includes(parentBlock.type) || isNewLineBlock(parentBlock)) {
            continue;
        } else if (!shouldConnectToCurrentBlockGroup(connectedBlocks, parentBlock)) {
            await publishBlockData(builtBlocksTextString, connectedBlocks[0], pageTitle, pageUrl, ownerId);
            builtBlocksTextString = '';
            connectedBlocks = [];
        }

        if (parentBlock.type === NotionBlockType.TABLE) {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            const aggregatedBlockText = getTextFromTable(
                aggregatedNestedBlocks.slice(1),
                parentBlock[parentBlock.type] as NotionTable,
            );
            await publishBlockData(aggregatedBlockText, parentBlock, pageTitle, pageUrl, ownerId);
        } else if (parentBlock.type === NotionBlockType.COLUMN_LIST) {
            const columnBlocks = await notionAPI.listPageBlocks(parentBlock.id, null);
            await Promise.all(
                columnBlocks.results.map(async (columnBlockParent: NotionBlock) => {
                    const columnNestedBlocks = await collectAllChildren(columnBlockParent, notionAPI);
                    const aggregatedBlockText = columnNestedBlocks
                        .slice(1)
                        .map((block) => getTextFromBlock(block))
                        .join('\n');
                    await publishBlockData(aggregatedBlockText, columnBlockParent, pageTitle, pageUrl, ownerId);
                }),
            );
        } else {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            builtBlocksTextString += aggregatedNestedBlocks.map((block) => getTextFromBlock(block)).join('\n');
            builtBlocksTextString += '. ';
            connectedBlocks.push(parentBlock);
        }
    }

    if (connectedBlocks.length) {
        await publishBlockData(builtBlocksTextString, connectedBlocks[0], pageTitle, pageUrl, ownerId);
    }
};

export const handler: Handler = async (req) => {
    const messageData: NotionSQSBaseBody = req.body;

    const notionKey = rsaService.decrypt(messageData.secret);
    const notionAPI = new NotionWrapper(notionKey);

    let isComplete = false;
    let nextCursor: string | null = null;
    const blocks: NotionBlock[] = [];

    console.log(`Processing page ${messageData.pageId}`);

    while (!isComplete) {
        const blockResponse: NotionBlockDetailResponse = await notionAPI.listPageBlocks(messageData.pageId, nextCursor);
        blocks.push(...blockResponse.results);
        isComplete = !blockResponse.has_more;
        nextCursor = blockResponse.next_cursor;
    }

    await processBlockList(notionAPI, blocks, messageData.ownerEntityId, messageData.pageUrl, messageData.pageTitle);
};
