export const NotionBaseUrl = 'https://api.notion.com';

export const NotionHeaders = {
	'Content-Type': 'application/json',
	'Notion-Version': '2022-06-28',
};

export const NotionEndpoints = {
    SEARCH: '/v1/search',
    BLOCK_DETAIL: (blockId: string) => `/v1/blocks/${blockId}/children?page_size=100`,
    BLOCK_DETAIL_WITH_CURSOR: (blockId: string, cursor: string) => `/v1/blocks/${blockId}/children?page_size=100&cursor=${cursor}`,
}

export enum NotionEndpointMethods {
    SEARCH = 'post',
    BLOCK_DETAIL  ='get',
}
