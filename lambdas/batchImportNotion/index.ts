import { type QdrantPayload, QdrantDataSource } from '@joshuajohnsonjj38/qdrant';
// import { QdrantWrapper, type QdrantPayload, QdrantDataSource } from '@joshuajohnsonjj38/qdrant';
import { NotionWrapper, ImportableBlockTypes, NotionBlockType } from '@joshuajohnsonjj38/notion';
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
} from '@joshuajohnsonjj38/notion';
// import omit from 'lodash/omit';
// import { OpenAIWrapper } from '@joshuajohnsonjj38/openai';
import { Handler, SQSEvent } from 'aws-lambda';
// import { SecretMananger } from '@joshuajohnsonjj38/secret-mananger';
// import { PrismaClient } from '@joshuajohnsonjj38/prisma';

// const openAI = new OpenAIWrapper('TODO');
// const qdrant = new QdrantWrapper('TODO', 1234, 'TODO');
// const secretMananger = new SecretMananger('', '', '');
// const prisma = new PrismaClient();

const getTextFromTable = (tableBlocks: NotionBlock[], parantTableSettings: NotionTable): string => {
    let stringifiedTable = 'Table content:\n';

    if (parantTableSettings.has_column_header) {
        const firstBlock = tableBlocks.shift() as NotionBlock;
        const firstRow = firstBlock[firstBlock.type] as NotionTableRow;
        stringifiedTable += '| ' + firstRow.cells.flatMap(
            (texts: NotionRichTextData[]) => texts.flatMap((text) => text.plain_text).join(' | ')
        );
        stringifiedTable += '| ' + Array(parantTableSettings.table_width).fill('---').join(' | ');
    }

    for (const block of tableBlocks) {
        const row = block[block.type] as NotionTableRow;
        stringifiedTable += '| ' + row.cells.flatMap(
            (texts: NotionRichTextData[]) => texts.flatMap((text) => text.plain_text).join(' | ')
        );
    }

    return stringifiedTable;
};

const getTextFromBlock = (block: NotionBlock): string => {
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

const collectAllChildren = async (rootBlock: NotionBlock, notionAPI: NotionWrapper): Promise<NotionBlock[]> => {
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

        const aggregatedNestedBlocks: NotionBlock[] = await collectAllChildren(parentBlock, notionAPI);

        let aggregatedBlockText = '';
        if (parentBlock.type === NotionBlockType.TABLE) {
            aggregatedBlockText = getTextFromTable(
                aggregatedNestedBlocks.slice(1),
                parentBlock[parentBlock.type] as NotionTable
            );
        } else if (parentBlock.type === NotionBlockType.COLUMN_LIST) {
            // ...
        } else {
            aggregatedBlockText = aggregatedNestedBlocks.map((block) => getTextFromBlock(block)).join('\n');
        }

        if (!aggregatedBlockText || !aggregatedBlockText.length) {
            continue;
        }

        const text = `Page Title: ${pageTitle}, Page Excerpt: ${aggregatedBlockText}`;
        const payload: QdrantPayload = {
            date: new Date(parentBlock.last_edited_time).getTime(),
            text,
            url: pageUrl,
            dataSource: QdrantDataSource.NOTION,
            sourceDataType: parentBlock.type,
            ownerId,
        };

        console.log(parentBlock.id, payload);

        // const embedding = await openAI.getTextEmbedding(text);
        // await qdrant.upsert(block.id, embedding, payload);
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

// TODO: handle deletion/archived
// TODO: handle table
// TODO: error handling

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
 *      secret: string,
 */
export const handler: Handler = async (event: SQSEvent) => {
  const processingPagePromises: Promise<void>[] = [];
  const completedDataSources: string[] = [];

  for (const record of event.Records) {
    const messageBody = JSON.parse(record.body);
    const notionKey = messageBody.secret; //secretMananger.decrypt(messageBody.secret);
    const notionAPI = new NotionWrapper(notionKey);

    processingPagePromises.push(
      processPage(notionAPI, messageBody.pageId, messageBody.ownerEntityId, messageBody.pageUrl, messageBody.pageTitle),
    );

    if (messageBody.isFinal) {
      completedDataSources.push(messageBody.dataSourceId);
    }
  }

  await Promise.all(processingPagePromises);
  // await prisma.dataSource.updateMany({
  //     where: {
  //         id: {
  //             in: completedDataSources,
  //         },
  //     },
  //     data: {
  //         lastSync: new Date(),
  //         isSyncing: false,
  //     },
  // });
};
