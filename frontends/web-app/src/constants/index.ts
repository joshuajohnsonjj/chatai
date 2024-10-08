import { SearchQueryParamType } from '../types/search-store';

export const BASE_S3_DATASOURCE_LOGO_URL = 'https://chatai-data-source-logos.s3.amazonaws.com/';

export const SEARCH_FILTER_TYPE_TO_ICON = {
    [SearchQueryParamType.TEXT]: 'mdi-magnify',
    [SearchQueryParamType.SOURCE]: 'mdi-cloud-outline',
    [SearchQueryParamType.CATEGORY]: 'mdi-shape-outline',
    [SearchQueryParamType.AUTHOR]: 'mdi-account-group-outline',
    [SearchQueryParamType.TOPIC]: 'mdi-tag',
    [SearchQueryParamType.DATE_LOWER]: 'mdi-sort-calendar-descending',
    [SearchQueryParamType.DATE_UPPER]: 'mdi-sort-calendar-ascending',
};
