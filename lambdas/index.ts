import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
// import { listNotionPages } from '../api/src/services/dataSources/notion';

// TODO: convert to lambda handler
// TODO: setup lerna https://lerna.js.org/

const NotionBaseUrl = 'https://api.notion.com';

const NotionHeaders = {
	'Content-Type': 'application/json',
	'Notion-Version': '2022-06-28',
};

const NotionEndpoints = {
    SEARCH: '/v1/search',
    PAGE_DETAIL: (pageId: string) => `/v1/pages/${pageId}`,
    BLOCK_DETAIL: (blockId: string) => `/v1/blocks/${blockId}/children?page_size=100`,
    BLOCK_DETAIL_WITH_CURSOR: (blockId: string, cursor: string) => `/v1/blocks/${blockId}/children?page_size=100&cursor=${cursor}`,
}

const listNotionPages = async (
	secret: string,
	startCursor?: string,
	pageSize = 100,
): Promise<any> => {
	try {
		// const data: any = {
		// 	page_size: pageSize,
		// 	// filter: {
		// 	// 	value: 'page',
		// 	// 	property: 'object',
		// 	// },
		// };

		// if (startCursor) {
		// 	data.start_cursor = startCursor;
		// }

		return axios.request({
			method: 'get',
			baseURL: NotionBaseUrl,
			url: NotionEndpoints.BLOCK_DETAIL('207a17fa-d1f5-4769-b9c2-e325b1082b8e'),
			headers: {
				...NotionHeaders,
				Authorization: `Bearer ${secret}`,
			},
		});
	} catch (error) {
		return {};
	}
};

const main = async (entityId: string, sourceId: string, sourceType: string, secret: string) => {
    const resp = await listNotionPages(secret);
    console.log(resp.data);
}

main('','','','secret_gGu6uREqxFZLLeiMGktrSpmoWllSNOB9KYUkGLBQv2c');