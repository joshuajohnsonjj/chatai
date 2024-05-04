import { SearchQueryParamType } from '../types/search-store';

export const TOKEN_STORAGE_KEY = 'chatai:token';
export const EMAIL_STORAGE_KEY = 'chatai:email';

export const BASE_S3_DATASOURCE_LOGO_URL = 'https://chatai-data-source-logos.s3.amazonaws.com/';

export const SEARCH_FILTER_TYPE_TO_ICON = {
    [SearchQueryParamType.TEXT]: 'mdi-magnify',
    [SearchQueryParamType.SOURCE]: 'mdi-cloud-outline',
    // [FilterTypes.CATEGORY]: 'mdi-shape-outline',
    [SearchQueryParamType.AUTHOR]: 'mdi-account-group-outline',
    [SearchQueryParamType.TOPIC]: 'mdi-pound',
    [SearchQueryParamType.DATE_LOWER]: 'mdi-calendar-range',
    [SearchQueryParamType.DATE_UPPER]: 'mdi-calendar-range',
};
