import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { APIEndpoints, APIMethods } from '../types/requests';
import { LoginUserResponse } from '../types/responses';
import { TOKEN_STORAGE_KEY } from '../constants/localStorageKeys';

const toast = useToast();

const refreshTokenRequest = async (email: string, refreshToken: string) => {
    const refreshData: LoginUserResponse = await sendAxiosRequest(
        {
            method: APIMethods.POST,
            headers: { 'Content-Type': 'application/json' },
            data: {
                username: email,
                refreshToken,
            },
            baseURL: (import.meta as any).env.VITE_API_BASE_URL,
            url: APIEndpoints.REFRESH,
        },
        false,
    );
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(refreshData));
};

export const sendAxiosRequest = async (req: AxiosRequestConfig, withAuthRetry = true) => {
    const tokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}');
    if (!req.url?.includes('auth')) {
        req.headers = {
            ...req.headers,
            Authorization: `Bearer ${tokenData.accessToken}`,
        };
    }

    try {
        const response = await axios(req);
        return response.data;
    } catch (e) {
        const isBadToken = e.response.data?.error?.name === 'UnauthorizedException';
        if (isBadToken && withAuthRetry && tokenData.email && tokenData.refreshToken) {
            await refreshTokenRequest(tokenData.email, tokenData.refreshToken);
            return await sendAxiosRequest(req, false);
        } else if (isBadToken) {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.pathname = '/login';
        } else if (e.response.data?.error?.code >= 400 && e.response.data?.error?.code < 500) {
            toast.error(e.response.data.error.message);
            throw e;
        } else {
            toast.error('An internal error has occured. Contact support if the issue continues.');
            throw e;
        }
    }
};

export const sendFetchRequest = async (url: RequestInfo, config: RequestInit, withAuthRetry = true) => {
    const tokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}');

    try {
        const response = await fetch(url, {
            ...config,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokenData.accessToken}`,
            },
        });
        return response.body;
    } catch (e) {
        const isBadToken = e.response.data?.error?.name === 'UnauthorizedException';
        if (isBadToken && withAuthRetry && tokenData.email && tokenData.refreshToken) {
            await refreshTokenRequest(tokenData.email, tokenData.refreshToken);
            return await sendFetchRequest(url, config, false);
        } else if (isBadToken) {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.pathname = '/login';
        } else if (e.response.data?.error?.code >= 400 && e.response.data?.error?.code < 500) {
            toast.error(e.response.data.error.message);
            throw e;
        } else {
            toast.error('An internal error has occured. Contact support if the issue continues.');
            throw e;
        }
    }
};
