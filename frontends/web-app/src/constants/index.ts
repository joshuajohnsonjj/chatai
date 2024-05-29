import { SearchQueryParamType } from '../types/search-store';

export const TOKEN_STORAGE_KEY = 'chatai:token';
export const EMAIL_STORAGE_KEY = 'chatai:email';

/**
 * stores stringified object w/ keys:
 * @param sideNavExpanded "1" or "0"
 * @param darkMode "1" or "0"
 */
export const SETTINGS_STORAGE_KEY = 'chatai:settings';

export const BASE_S3_DATASOURCE_LOGO_URL = 'https://chatai-data-source-logos.s3.amazonaws.com/';

export const SEARCH_FILTER_TYPE_TO_ICON = {
    [SearchQueryParamType.TEXT]: 'mdi-magnify',
    [SearchQueryParamType.SOURCE]: 'mdi-cloud-outline',
    [SearchQueryParamType.CATEGORY]: 'mdi-shape-outline',
    [SearchQueryParamType.AUTHOR]: 'mdi-account-group-outline',
    [SearchQueryParamType.TOPIC]: 'mdi-pound',
    [SearchQueryParamType.DATE_LOWER]: 'mdi-calendar-range',
    [SearchQueryParamType.DATE_UPPER]: 'mdi-calendar-range',
};
