import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { APIEndpoints, APIMethods } from '../types/requests';
import { LoginUserResponse } from '../types/responses';
import { TOKEN_STORAGE_KEY } from '../constants';

const toast = useToast();

const refreshTokenRequest = async (email: string, refreshToken: string) => {
    const refreshData: LoginUserResponse = await sendAPIRequest(
        {
            method: APIMethods.POST,
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                username: email,
                refreshToken,
            },
            baseURL: import.meta.env.VITE_API_BASE_URL,
            url: APIEndpoints.REFRESH,
        },
        false,
    );
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(refreshData));
};

export const sendAPIRequest = async (req: AxiosRequestConfig, withAuthRetry = true) => {
    const tokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}');
    if (!req.url?.includes('userAuth')) {
        req.headers = {
            ...req.headers,
            Authorization: `Bearer ${tokenData.accessToken}`,
        };
    }

    try {
        const resp = await axios(req);
        return resp.data;
    } catch (e) {
        const isBadToken = e.response.data.error.name === 'UnauthorizedException';
        if (isBadToken && withAuthRetry && tokenData.email && tokenData.refreshToken) {
            await refreshTokenRequest(tokenData.email, tokenData.refreshToken);
            return await sendAPIRequest(req, false);
        } else if (isBadToken) {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.pathname = '/login';
        } else if (e.response.data.error.code >= 400 && e.response.data.error.code <= 404) {
            toast.error(e.response.data.error.message);
        } else if (e.response.data.error.code === 500) {
            toast.error('An internal error has occured. Contact support if the issue continues.');
        }
    }
};
