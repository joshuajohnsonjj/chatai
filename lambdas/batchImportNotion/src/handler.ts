import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
import type { NotionBlock, NotionBlockDetailResponse, NotionTable } from '@joshuajohnsonjj38/notion';
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
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../.env' });

const rsaService = new RsaCipher(process.env.RSA_PRIVATE_KEY);
const prisma = new PrismaClient();

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

const processPage = async (
    notionAPI: NotionWrapper,
    pageId: string,
    ownerId: string,
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

    await processBlockList(notionAPI, blocks, ownerId, pageUrl, pageTitle);
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
 *
 * Or at the end of a data source's sync messages
 *      dataSourceId: string,
 *      isFinal: true,
 */
export const handler: Handler = async (event: SQSEvent) => {
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
            continue;
        }

        const notionKey = rsaService.decrypt(messageBody.secret);
        const notionAPI = new NotionWrapper(notionKey);

        processingPagePromises.push(
            processPage(
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
        console.log('Sync completed ofr data source records:', completedDataSources);

        await prisma.dataSource.updateMany({
            where: {
                id: {
                    in: completedDataSources,
                },
            },
            data: {
                lastSync: new Date(),
                isSyncing: false,
                updatedAt: new Date(),
            },
        });
    }
};
