import { APIEndpoints, APIMethods } from '../types/requests';
import { sendAPIRequest } from './service';

export const getGoogleToken = async (): Promise<void> => {
    await sendAPIRequest(
        {
            method: APIMethods.GET,
            baseURL: (import.meta as any).env.VITE_API_BASE_URL,
            url: APIEndpoints.GOOGLE_AUTHENTICATE,
        },
        false,
    );
};
