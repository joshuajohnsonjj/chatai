import { FilterTypes } from '../types/search';

export const TOKEN_STORAGE_KEY = 'chatai:token';
export const EMAIL_STORAGE_KEY = 'chatai:email';

export const BASE_S3_DATASOURCE_LOGO_URL = 'https://chatai-data-source-logos.s3.amazonaws.com/';

export const SEARCH_FILTER_TYPE_TO_ICON = {
    [FilterTypes.CONTENT]: 'mdi-magnify',
    [FilterTypes.SOURCES]: 'mdi-cloud-outline',
    [FilterTypes.CATEGORY]: 'mdi-shape-outline',
    [FilterTypes.PERSON]: 'mdi-account-group-outline',
    [FilterTypes.TOPIC]: 'mdi-pound',
    [FilterTypes.DATE]: 'mdi-calendar-range',
};
