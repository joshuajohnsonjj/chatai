import type {
    NotionBaseDataStore,
    NotionBlock,
    NotionBlockDetailResponse,
    NotionCode,
    NotionEquation,
    NotionParagraph,
    NotionRichTextData,
    NotionSQSMessageBody,
    NotionTable,
    NotionTableRow,
    NotionToDo,
    NotionWrapper,
} from '@joshuajohnsonjj38/notion';
import { JoinableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantDataSource, QdrantWrapper, type QdrantPayload } from '@joshuajohnsonjj38/qdrant';
import { DynamoDBClient } from '@joshuajohnsonjj38/dynamo';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env' });

const openAI = new OpenAIWrapper(process.env.GEMINI_KEY as string);
const qdrant = new QdrantWrapper(
    process.env.QDRANT_HOST as string,
    process.env.QDRANT_COLLECTION as string,
    process.env.QDRANT_KEY as string,
);
const dynamo = new DynamoDBClient(
    process.env.AWS_ACCESS_KEY as string,
    process.env.AWS_SECRET as string,
    process.env.AWS_REGION as string,
);

/**
 * Takes Notion block table data and converts into a
 * Markdown table formatted string
 */
export const getTextFromTable = (tableBlocks: NotionBlock[], parantTableSettings: NotionTable): string => {
    const stringifyTableRow = (row: NotionTableRow): string => {
        return (
            '| ' +
            row.cells
                .flatMap((texts: NotionRichTextData[]) => texts.flatMap((text) => text.plain_text).join(''))
                .join(' | ') +
            ' |\n'
        );
    };

    let stringifiedTable = 'Markdown formatted table:\n';

    if (parantTableSettings.has_column_header) {
        const firstBlock = tableBlocks.shift() as NotionBlock;
        const firstRow = firstBlock[firstBlock.type] as NotionTableRow;
        stringifiedTable += stringifyTableRow(firstRow);
        stringifiedTable += '| ' + Array(parantTableSettings.table_width).fill('---').join(' | ') + ' |';
        stringifiedTable += '\n';
    }

    for (const block of tableBlocks) {
        const row = block[block.type] as NotionTableRow;
        stringifiedTable += stringifyTableRow(row);
    }

    return stringifiedTable;
};

export const getTextFromBlock = (block: NotionBlock): string => {
    switch (block.type) {
        case NotionBlockType.CODE: {
            const codeData = block[block.type] as NotionCode;
            return `Programming language: ${codeData.language}.\t Code: ${codeData.rich_text
                .map((textBlock) => textBlock.plain_text)
                .join('')}`;
        }
        case NotionBlockType.EQUATION: {
            const equationData = block[block.type] as NotionEquation;
            return `Math equation: ${equationData.expression}`;
        }
        case NotionBlockType.TO_DO: {
            const todoData = block[block.type] as NotionToDo;
            return `Todo item ${
                todoData.checked ? 'complete' : 'incomplete'
            }:\t${todoData.rich_text.map((textBlock) => textBlock.plain_text).join('')}`;
        }
        default: {
            const textData = block[block.type] as NotionBaseDataStore;
            return (textData.rich_text ?? []).map((textBlock) => textBlock.plain_text).join('');
        }
    }
};

/**
 * Starting with a parent block, recursively retreives the tree of
 * child blocks via DFS traversal and returns all children as
 * array of Notion blocks
 */
export const collectAllChildren = async (rootBlock: NotionBlock, notionAPI: NotionWrapper): Promise<NotionBlock[]> => {
    const allChildren: NotionBlock[] = [rootBlock];

    const collectChildren = async (block: NotionBlock): Promise<void> => {
        if (block.has_children) {
            const children: NotionBlock[] = [];
            let isComplete = false;
            let nextCursor: string | null = null;

            while (!isComplete) {
                const blockResponse: NotionBlockDetailResponse = await notionAPI.listPageBlocks(block.id, nextCursor);
                children.push(...blockResponse.results);

                isComplete = !blockResponse.has_more;
                nextCursor = blockResponse.next_cursor;
            }

            allChildren.push(...children);
            await Promise.all(children.map((child) => collectChildren(child)));
        }
    };

    await collectChildren(rootBlock);

    return allChildren;
};

export const publishBlockData = async (
    aggregatedBlockText: string,
    parentBlock: NotionBlock,
    pageTitle: string,
    pageUrl: string,
    ownerId: string,
): Promise<void> => {
    if (!aggregatedBlockText || !aggregatedBlockText.length) {
        return;
    }

    const text = `Page Title: ${pageTitle}, Page Excerpt: ${aggregatedBlockText}`;
    const payload: QdrantPayload = {
        date: new Date(parentBlock.last_edited_time).getTime(),
        dataSource: QdrantDataSource.NOTION,
        ownerId,
    };

    const embedding = await openAI.getTextEmbedding(text);
    await Promise.all([
        qdrant.upsert(parentBlock.id, embedding, payload),
        dynamo.putItem({
            id: parentBlock.id,
            ownerEntityId: ownerId,
            text,
            createdAt: new Date().toISOString(),
            url: pageUrl,
        }),
    ]);
};

export const isValidMessageBody = (body: NotionSQSMessageBody): boolean => {
    if (
        'pageId' in body &&
        typeof body.pageId === 'string' &&
        'pageUrl' in body &&
        typeof body.pageUrl === 'string' &&
        'ownerEntityId' in body &&
        typeof body.ownerEntityId === 'string' &&
        'pageTitle' in body &&
        typeof body.pageTitle === 'string' &&
        'secret' in body &&
        typeof body.secret === 'string' &&
        typeof body.dataSourceId === 'string'
    ) {
        return true;
    }
    if ('isFinal' in body && typeof body.isFinal === 'boolean' && typeof body.dataSourceId === 'string') {
        return true;
    }
    return false;
};

export const isNewLineBlock = (block: NotionBlock): boolean =>
    block.type === NotionBlockType.PARAGRAPH && !(block[NotionBlockType.PARAGRAPH] as NotionParagraph).rich_text.length;

export const shouldConnectToCurrentBlockGroup = (blockGroup: NotionBlock[], currentBlock: NotionBlock): boolean => {
    if (!blockGroup.length || !JoinableBlockTypes.includes(currentBlock.type)) {
        return false;
    }

    const currentGroupBlockTypes = blockGroup.map((block) => block.type);

    if (
        (currentBlock.type === NotionBlockType.HEADING_1 &&
            currentGroupBlockTypes.includes(NotionBlockType.HEADING_1)) ||
        (currentBlock.type === NotionBlockType.HEADING_2 &&
            currentGroupBlockTypes.includes(NotionBlockType.HEADING_1)) ||
        (currentBlock.type === NotionBlockType.HEADING_2 &&
            currentGroupBlockTypes.includes(NotionBlockType.HEADING_2)) ||
        (currentBlock.type === NotionBlockType.HEADING_3 &&
            currentGroupBlockTypes.includes(NotionBlockType.HEADING_3)) ||
        (currentBlock.type === NotionBlockType.HEADING_3 &&
            currentGroupBlockTypes.includes(NotionBlockType.HEADING_2)) ||
        (currentBlock.type === NotionBlockType.HEADING_3 && currentGroupBlockTypes.includes(NotionBlockType.HEADING_1))
    ) {
        return false;
    }

    return true;
};
