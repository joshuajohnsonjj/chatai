import { QdrantWrapper, type QdrantPayload, QdrantDataSource } from '@joshuajohnsonjj38/qdrant';
import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
import type {
    NotionBaseDataStore,
    NotionBlock,
    NotionBlockData,
    NotionBlockDetailResponse,
    NotionCode,
    NotionEquation,
    NotionToDo,
} from '@joshuajohnsonjj38/notion';
import omit from 'lodash/omit';
import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { Handler } from 'aws-lambda';
import { SecretMananger } from '@joshuajohnsonjj38/secret-mananger';
import { PrismaClient } from '@joshuajohnsonjj38/prisma';

const openAI = new OpenAIWrapper('TODO');
const qdrant = new QdrantWrapper('TODO', 1234, 'TODO');
const secretMananger = new SecretMananger('', '', '');
const prisma = new PrismaClient();

const flattenChildren = (item: any): NotionBlock[] => {
    let flattened: NotionBlock[] = [omit(item, ['children'])];

    if (item?.children && item.children.length > 0) {
        item.children.forEach((child: NotionBlockData) => {
            flattened = flattened.concat(flattenChildren(child));
        });
    }

    return flattened;
};

const getTextFromBlock = (block: NotionBlock): string => {
    switch (block.type) {            
        case NotionBlockType.CODE:
            const codeData = block[block.type] as NotionCode;
            return `
                Programming language: ${codeData.language}.\t
                Code: ${codeData.rich_text.map((textBlock) => textBlock.plain_text).join('')}
            `;
        case NotionBlockType.EQUATION:
            const equationData = block[block.type] as NotionEquation;
            return equationData.expression;
        case NotionBlockType.TO_DO:
            const todoData = block[block.type] as NotionToDo;
            return `
                Todo item ${todoData.checked ? 'complete' : 'incomplete'}:\t
                ${todoData.rich_text.map((textBlock) => textBlock.plain_text).join('')}
            `;
        case NotionBlockType.COLUMN_LIST:
            return '';
        case NotionBlockType.TABLE:
            return '';
        default:
            const textData = block[block.type] as NotionBaseDataStore;
            return textData.rich_text.map((textBlock) => textBlock.plain_text).join('');
    }
};

const processBlockList = (blocks: NotionBlock[], ownerId: string, pageUrl: string) => {
    blocks.forEach(async (block) => {
        if (!ImportableBlockTypes.includes(block.type) || block.in_trash) {
            return;
        }

        const aggregatedNestedBlocks = flattenChildren(block);
        const text = aggregatedNestedBlocks.map((block) => getTextFromBlock(block)).join('\n');
        const payload: QdrantPayload = {
            date: new Date(block.last_edited_time).getTime(),
            text,
            url: pageUrl,
            dataSource: QdrantDataSource.NOTION,
            sourceDataType: block.type,
            ownerId,
        };
        
        const embedding = await openAI.getTextEmbedding(text);
        await qdrant.upsert(block.id, embedding, payload);
    });
};

// TODO: handle deletion/archived
// TODO: handle table/columns

/**
 * Lambda SQS handler
 * 
 * @param event - SQS event body expected to have following data
 *      pageId: string,
 *      pageUrl: string,
 *      ownerEntityId: string,
 *      secret: string,
 */
export const handler: Handler = async (event) => {
    const messageData = JSON.parse(event.body);
    const notionKey = secretMananger.decrypt(messageData.secret);
    const notionService = new NotionWrapper(notionKey);
    
    let isComplete = false;
    let nextCursor: string | null = null;

    while (!isComplete) {
        const resp = await notionService.listPageBlocks(messageData.pageId, nextCursor);
        const blockResponse: NotionBlockDetailResponse = resp.data;
        processBlockList(blockResponse.results, messageData.ownerEntityId, messageData.pageUrl);
        isComplete = !blockResponse.has_more;
        nextCursor = blockResponse.next_cursor;
    }

    if (messageData.isFinal) {
        await prisma.dataSource.update({
            where: {
                id: event.dataSourceId,
            },
            data: {
                lastSync: new Date(),
                isSyncing: false,
            },
        });
    }
};
