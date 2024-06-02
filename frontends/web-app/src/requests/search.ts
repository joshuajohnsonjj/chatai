import { APIEndpoints, APIMethods } from '../types/requests';
import type { SearchQueryResponse, SearchResult, SearchSuggestionsResponse } from '../types/responses';
import type { SearchQueryParams } from '../types/search-store';
import { sendAPIRequest } from './service';

export const executeQuery = async (
    searchParams: SearchQueryParams,
    entityId: string,
    skip: number | null,
): Promise<SearchQueryResponse> => {
    const resp = await sendAPIRequest({
        method: APIMethods.POST,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.SEARCH,
        data: {
            entityId,
            ...searchParams,
            skip: skip ?? undefined,
        },
    });
    return resp as SearchQueryResponse;
};

export const getTopicSuggestions = async (entityId: string, text?: string): Promise<SearchSuggestionsResponse> => {
    const query = new URLSearchParams({ text: text ?? '', entityId }).toString();
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: `${APIEndpoints.TOPIC_SUGGESTIONS}?${query}`,
    });
    return resp as SearchSuggestionsResponse;
};

export const getSearchResultById = async (resultId: string): Promise<SearchResult | null> => {
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: (import.meta as any).env.VITE_API_BASE_URL,
        url: APIEndpoints.SEARCH_RESULT.replace(':resultId', resultId),
    });
    return resp as SearchResult | null;
};
