export const NotionBaseUrl = 'https://api.notion.com';

export const NotionHeaders = {
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
};

export const NotionEndpoints = {
    SEARCH: '/v1/search',
    BLOCK_DETAIL: (blockId: string) => `/v1/blocks/${blockId}/children?page_size=100`,
    BLOCK_DETAIL_WITH_CURSOR: (blockId: string, cursor: string) =>
        `/v1/blocks/${blockId}/children?page_size=100&cursor=${cursor}`,
    USER_DETAIL: (userId: string) => `/v1/users/${userId}`,
};

export const NotionEndpointMethods = {
    SEARCH: 'post',
    BLOCK_DETAIL: 'get',
    USER_DETAIL: 'get',
};

export const ImportableBlockTypes = [
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
