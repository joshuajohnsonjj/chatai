import { APIEndpoints, APIMethods } from '../types/requests';
import { UserInfoResponse } from '../types/responses';
import { sendAPIRequest } from './service';

export const getUserInfo = async (): Promise<UserInfoResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.USER,
    });
    return resp as UserInfoResponse;
};

export const uploadAvatarToS3 = async (imageBase64: string, fileType: string): Promise<{ imageUrl: string }> => {
    const resp = await sendAPIRequest({
        method: APIMethods.POST,
        headers: { 'Content-Type': 'application/json' },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.USER_IMAGE,
        data: { imageBase64, fileType },
    });
    return resp;
};
