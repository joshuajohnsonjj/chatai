import type {
    NotionBaseDataStore,
    NotionBlock,
    NotionBlockDetailResponse,
    NotionCode,
    NotionEquation,
    NotionRichTextData,
    NotionTable,
    NotionTableRow,
    NotionToDo,
    NotionWrapper,
} from '@joshuajohnsonjj38/notion';
import { NotionBlockType } from '@joshuajohnsonjj38/notion';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { QdrantDataSource, QdrantWrapper, type QdrantPayload } from '@joshuajohnsonjj38/qdrant';

const openAI = new OpenAIWrapper(process.env.OPENAI_SECRET as string);
const qdrant = new QdrantWrapper(
    process.env.QDRANT_HOST as string,
    parseInt(process.env.QDRANT_PORT as string, 10),
    process.env.QDRANT_COLLECTION as string,
);

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

            for (const child of children) {
                allChildren.push(child);
                await collectChildren(child);
            }
        }
    };

    await collectChildren(rootBlock);
    return allChildren;
};

export const publishToQdrant = async (
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
        text,
        url: pageUrl,
        dataSource: QdrantDataSource.NOTION,
        ownerId,
    };

    const embedding = await openAI.getTextEmbedding(text);
    await qdrant.upsert(parentBlock.id, embedding, payload);
};
