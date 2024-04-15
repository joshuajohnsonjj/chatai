import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
import type { NotionBlock, NotionBlockDetailResponse, NotionTable } from '@joshuajohnsonjj38/notion';
import { Handler, SQSEvent } from 'aws-lambda';
import { collectAllChildren, getTextFromBlock, getTextFromTable, publishToQdrant } from './utility';
import { RsaCipher } from '@joshuajohnsonjj38/secret-mananger';
import { PrismaClient } from '@joshuajohnsonjj38/prisma';

const rsaService = new RsaCipher('./private.pem');
const prisma = new PrismaClient();

const processBlockList = async (
    notionAPI: NotionWrapper,
    blocks: NotionBlock[],
    ownerId: string,
    pageUrl: string,
    pageTitle: string,
) => {
    for (const parentBlock of blocks) {
        if (!ImportableBlockTypes.includes(parentBlock.type) || parentBlock.in_trash) {
            continue;
        }

        let aggregatedBlockText = '';
        if (parentBlock.type === NotionBlockType.TABLE) {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            aggregatedBlockText = getTextFromTable(
                aggregatedNestedBlocks.slice(1),
                parentBlock[parentBlock.type] as NotionTable,
            );
            await publishToQdrant(aggregatedBlockText, parentBlock, pageTitle, pageUrl, ownerId);
        } else if (parentBlock.type === NotionBlockType.COLUMN_LIST) {
            const columnBlocks = await notionAPI.listPageBlocks(parentBlock.id, null);
            await Promise.all(
                columnBlocks.results.map(async (columnBlockParent: NotionBlock) => {
                    const columnNestedBlocks = await collectAllChildren(columnBlockParent, notionAPI);
                    aggregatedBlockText = columnNestedBlocks
                        .slice(1)
                        .map((block) => getTextFromBlock(block))
                        .join('\n');
                    await publishToQdrant(aggregatedBlockText, columnBlockParent, pageTitle, pageUrl, ownerId);
                }),
            );
        } else {
            const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);
            aggregatedBlockText = aggregatedNestedBlocks.map((block) => getTextFromBlock(block)).join('\n');
            await publishToQdrant(aggregatedBlockText, parentBlock, pageTitle, pageUrl, ownerId);
        }
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
    const processingBlockPromises: Promise<void>[] = [];

    while (!isComplete) {
        const blockResponse: NotionBlockDetailResponse = await notionAPI.listPageBlocks(pageId, nextCursor);
        processingBlockPromises.push(processBlockList(notionAPI, blockResponse.results, ownerId, pageUrl, pageTitle));
        isComplete = !blockResponse.has_more;
        nextCursor = blockResponse.next_cursor;
    }

    await Promise.all(processingBlockPromises);
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

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

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
};
