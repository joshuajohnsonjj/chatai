import { APIEndpoints, APIMethods } from '../types/requests';
import { LoginUserResponse } from '../types/responses';
import { sendAPIRequest } from './service';

export const loginUser = async (email: string, password: string): Promise<LoginUserResponse> => {
    const resp = await sendAPIRequest(
        {
            method: APIMethods.LOGIN,
            data: {
                username: email,
                password,
            },
            headers: {
                'Content-Type': 'application/json',
            },
            baseURL: 'http://localhost:3001',
            url: APIEndpoints.LOGIN,
        },
        false,
    );
    return resp as LoginUserResponse;
};
