import axios from 'axios';
import { SlackBaseUrl, TSlackEndpoints, SlackHeaders } from './constants';
import { ISlackConversationListRequestBody } from './types';

export class SlackWrapper {
	private readonly accessToken: string;

	constructor(secret: string) {
		this.accessToken = secret;
	}

	public testConnection = async (): Promise<boolean> => {
		try {
			await axios.request({
				method: 'post',
				baseURL: SlackBaseUrl,
				url: TSlackEndpoints.CONVERSATION_LIST,
				headers: {
					...SlackHeaders,
					Authorization: `Bearer ${this.accessToken}`,
				},
				data: {
					limit: 1,
				} as ISlackConversationListRequestBody,
			});
			return true;
		} catch (error) {
			return false;
		}
	};
}
