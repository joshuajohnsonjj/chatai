import { APIEndpoints, APIMethods } from '../types/requests';
import type { SearchQueryResponse } from '../types/responses';
import { SearchQueryParams } from '../types/search-store';
import { sendAPIRequest } from './service';

export const executeQuery = async (searchParams: SearchQueryParams, entityId: string): Promise<SearchQueryResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.POST,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
        url: APIEndpoints.SEARCH,
        data: {
            entityId,
            ...searchParams,
        },
    });
    return resp as SearchQueryResponse;
};
