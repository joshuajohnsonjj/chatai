import { APIEndpoints, APIMethods } from '../types/requests';
import { UserInfoResponse } from '../types/responses';
import { sendAPIRequest } from './service';

export const getUserInfo = async (): Promise<UserInfoResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: APIEndpoints.USER_INFO,
    });
    return resp as UserInfoResponse;
};
