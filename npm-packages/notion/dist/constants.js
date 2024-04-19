"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinableBlockTypes = exports.ImportableBlockTypes = exports.NotionEndpointMethods = exports.NotionEndpoints = exports.NotionHeaders = exports.NotionBaseUrl = void 0;
exports.NotionBaseUrl = 'https://api.notion.com';
exports.NotionHeaders = {
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
};
exports.NotionEndpoints = {
    SEARCH: '/v1/search',
    BLOCK_DETAIL: (blockId) => `/v1/blocks/${blockId}/children?page_size=100`,
    BLOCK_DETAIL_WITH_CURSOR: (blockId, cursor) => `/v1/blocks/${blockId}/children?page_size=100&cursor=${cursor}`,
    USER_DETAIL: (userId) => `/v1/users/${userId}`,
};
exports.NotionEndpointMethods = {
    SEARCH: 'post',
    BLOCK_DETAIL: 'get',
    USER_DETAIL: 'get',
};
exports.ImportableBlockTypes = [
    'bulleted_list_item',
    'callout',
    'code',
    'column_list',
    'column',
    'embed',
    'equation',
    'heading_1',
    'heading_2',
    'heading_3',
    'numbered_list_item',
    'paragraph',
    'quote',
    'table',
    'table_row',
    'to_do',
    'toggle',
];
/**
 * Blocks of these types w/o an empty
 * paragraph between (i.e. new line),
 * should joined into one record
 */
exports.JoinableBlockTypes = [
    'bulleted_list_item',
    'embed',
    'equation',
    'heading_1',
    'heading_2',
    'heading_3',
    'numbered_list_item',
    'paragraph',
    'quote',
    'to_do',
];
