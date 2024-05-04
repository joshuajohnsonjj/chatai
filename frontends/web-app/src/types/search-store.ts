export enum SearchQueryParamType {
    TEXT = 'TEXT',
    TOPIC = 'TOPIC',
    AUTHOR = 'AUTHOR',
    SOURCE = 'SOURCE',
    DATE_LOWER = 'DATE_LOWER',
    DATE_UPPER = 'DATE_UPPER',
}

export interface SearchQueryParams {
    queryText?: string;
    topics?: string[];
    sourceTypeFilters?: string[];
    authorFilters?: string[];
    dateRangeLower?: number; // Unix timestamp
    dateRangeUpper?: number; // Unix timestamp
}

export interface QueryParam {
    type: SearchQueryParamType;
    value: string | number;
}
