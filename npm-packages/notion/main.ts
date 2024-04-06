import axios from 'axios';
import { NotionBaseUrl, NotionEndpointMethods, NotionEndpoints, NotionHeaders } from './constants';
import { INotionSearchPayload, INotionSearchResponse, INotionUserDetailResponse } from './types';

export class NotionWrapper {
	private readonly secret: string;

	constructor(secret: string) {
		this.secret = secret;
	}

	public testConnection = async (): Promise<boolean> => {
		try {
			await axios.request({
				method: NotionEndpointMethods.SEARCH,
				baseURL: NotionBaseUrl,
				url: NotionEndpoints.SEARCH,
				headers: {
					...NotionHeaders,
					Authorization: `Bearer ${this.secret}`,
				},
				data: {
					page_size: 1,
				} as INotionSearchPayload,
			});
			return true;
		} catch (error) {
			return false;
		}
	};

	public listPages = async (
		startCursor?: string,
		pageSize = 100,
	): Promise<INotionSearchResponse> => {
		const data: INotionSearchPayload = {
			page_size: pageSize,
			filter: {
				value: 'page',
				property: 'object',
			},
		};

		if (startCursor) {
			data.start_cursor = startCursor;
		}

		const resp = await axios.request({
			method: NotionEndpointMethods.SEARCH,
			baseURL: NotionBaseUrl,
			url: NotionEndpoints.SEARCH,
			headers: {
				...NotionHeaders,
				Authorization: `Bearer ${this.secret}`,
			},
			data,
		});
		return resp.data;
	};

	public listPageBlocks = async (blockId: string, startCursor?: string): Promise<any> => {
		try {
			let url = NotionEndpoints.BLOCK_DETAIL(blockId);

			if (startCursor) {
				url = NotionEndpoints.BLOCK_DETAIL_WITH_CURSOR(blockId, startCursor);
			}

			const resp = await axios.request({
				method: NotionEndpointMethods.BLOCK_DETAIL,
				baseURL: NotionBaseUrl,
				url,
				headers: {
					...NotionHeaders,
					Authorization: `Bearer ${this.secret}`,
				},
			});
			return resp.data;
		} catch (error) {
			return {};
		}
	};

	public getUserInfo = async (userId: string): Promise<INotionUserDetailResponse> => {
		const resp = await axios.request({
			method: NotionEndpointMethods.USER_DETAIL,
			baseURL: NotionBaseUrl,
			url: NotionEndpoints.USER_DETAIL(userId),
			headers: {
				...NotionHeaders,
				Authorization: `Bearer ${this.secret}`,
			},
		});
		return resp.data;
	};
}
