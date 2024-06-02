import { APIEndpoints, APIMethods } from '../types/requests';
import { LoginUserResponse } from '../types/responses';
import { sendAPIRequest } from './service';

export const loginUser = async (email: string, password: string): Promise<LoginUserResponse> => {
    const resp = await sendAPIRequest(
        {
            method: APIMethods.POST,
            data: {
                username: email,
                password,
            },
            headers: {
                'Content-Type': 'application/json',
            },
            baseURL: (import.meta as any).env.VITE_API_BASE_URL,
            url: APIEndpoints.LOGIN,
        },
        false,
    );
    return resp as LoginUserResponse;
};
