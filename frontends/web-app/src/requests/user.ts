import { APIEndpoints, APIMethods } from '../types/requests';
import { UserInfoResponse } from '../types/responses';
import { sendAPIRequest } from './service';

export const getUserInfo = async (): Promise<UserInfoResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: import.meta.env.VITE_API_BASE_URL,
        url: APIEndpoints.USER_INFO,
    });
    return resp as UserInfoResponse;
};
