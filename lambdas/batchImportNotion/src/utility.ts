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
} from '../../lib/dataSources/notion';
import { ImportableBlockTypes, JoinableBlockTypes, NotionBlockType, getBlockUrl } from '../../lib/dataSources/notion';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import type { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import * as dotenv from 'dotenv';
import { NOTION_DATA_SOURCE_NAME } from './constants';
import { cleanExcessWhitespace, isEmptyContent } from '../../lib/helper';
import { CachedUser } from './types';

dotenv.config({ path: __dirname + '/../../../../.env' });

const gemini = new GeminiService(process.env.GEMINI_KEY as string);

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
        // TODO: remove this log.. not useful, creates alot of noise
        console.log(`collecting children for ${block.id}`);

        if (block.has_children) {
            const children: NotionBlock[] = [];
            let isComplete = false;
            let nextCursor: string | null = null;

            while (!isComplete) {
                const blockResponse: NotionBlockDetailResponse = await notionAPI.listPageBlocks(block.id, nextCursor);
                const filteredChildren = blockResponse.results.filter((block) =>
                    ImportableBlockTypes.includes(block.type),
                );
                children.push(...filteredChildren);

                isComplete = !blockResponse.has_more || filteredChildren.length === 0;
                nextCursor = blockResponse.next_cursor;
            }

            allChildren.push(...children);
            await Promise.all(children.map((child) => collectChildren(child)));
        }
    };

    await collectChildren(rootBlock);

    return allChildren;
};

/**
 * Publishes text embeddings and metadata to mongo
 */
export const publishBlockData = async (
    mongo: MongoDBService,
    aggregatedBlockText: string,
    parentBlock: NotionBlock,
    pageTitle: string,
    pageUrl: string,
    entityId: string,
    author: CachedUser | null,
): Promise<void> => {
    if (!aggregatedBlockText || !aggregatedBlockText.length) {
        return;
    }

    const cleanedAggregatedText = cleanExcessWhitespace(aggregatedBlockText);

    if (isEmptyContent(cleanedAggregatedText)) {
        return;
    }

    const fullTextWithTitle = `Page Title: ${pageTitle}, Page Excerpt: ${cleanedAggregatedText}`;
    const [embedding, annotations] = await Promise.all([
        gemini.getTextEmbedding(fullTextWithTitle),
        gemini.getTextAnnotation(cleanedAggregatedText),
    ]);
    const annotationLabels = [...annotations.categories, ...annotations.entities];

    await Promise.all([
        author
            ? mongo.writeAuthors({
                  name: author.name,
                  email: author.email,
                  entityId,
              })
            : Promise.resolve(),
        mongo.writeLabels(annotationLabels, entityId),
        mongo.writeDataElements({
            _id: parentBlock.id,
            ownerEntityId: entityId,
            text: cleanedAggregatedText,
            title: pageTitle,
            embedding,
            createdAt: new Date(parentBlock.last_edited_time).getTime(),
            url: getBlockUrl(pageUrl, parentBlock.id),
            annotations: annotationLabels,
            dataSourceType: NOTION_DATA_SOURCE_NAME,
            author: author ?? undefined,
        }),
    ]);
};

export const isValidMessageBody = (body: NotionSQSMessageBody): boolean => {
    if (
        typeof body.pageId === 'string' &&
        typeof body.pageUrl === 'string' &&
        typeof body.ownerEntityId === 'string' &&
        typeof body.pageTitle === 'string' &&
        typeof body.secret === 'string' &&
        typeof body.dataSourceId === 'string' &&
        typeof body.isFinal === 'boolean'
    ) {
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
