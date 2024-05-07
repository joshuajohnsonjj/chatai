import { APIEndpoints, APIMethods } from '../types/requests';
import type { SearchQueryResponse, SearchResult, SearchSuggestionsResponse } from '../types/responses';
import type { SearchQueryParams } from '../types/search-store';
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

export const getTopicSuggestions = async (entityId: string, text?: string): Promise<SearchSuggestionsResponse> => {
    const query = new URLSearchParams({ text: text ?? '', entityId }).toString();
    const resp = await sendAPIRequest({
        method: APIMethods.GET,
        headers: {
            'Content-Type': 'application/json',
        },
        baseURL: 'http://localhost:3001',
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
        baseURL: 'http://localhost:3001',
        url: APIEndpoints.SEARCH_RESULT.replace(':resultId', resultId),
    });
    return resp as SearchResult | null;
};
