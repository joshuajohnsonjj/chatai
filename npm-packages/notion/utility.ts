import { NotionPageDetailResponse } from './types';

export const getPageTitle = (pageDetail: NotionPageDetailResponse): string => {
    const title = pageDetail.properties?.title;
    if (title?.length) {
        return title[0].plain_text;
    }

    const name = pageDetail.properties?.Name?.title;
    if (name?.length) {
        return name[0].plain_text;
    }

    return '';
};
