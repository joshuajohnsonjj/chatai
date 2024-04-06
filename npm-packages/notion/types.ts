export interface INotionSearchPayload {
    query?: string;
    sort?: {
        direction: 'ascending' | 'descending';
        timestamp: 'created_time' | 'last_edited_time';
    };
    filter?: {
        value: 'page' | 'database';
        property: 'object';
    };
    start_cursor?: string;
    page_size?: number; // max 100
}
  
export interface INotionSearchResponse {
    object: 'page' | 'database';
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: { object: 'user'; id: string; };
    last_edited_by: { object: 'user'; id: string; };
    parent: {
        type: string;
        database_id: string;
    };
    archived: boolean;
    in_trash: boolean;
    url: string;
    public_url: string;
}
  
export interface INotionUserDetailResponse {
    object: 'user';
    id: string;
    type: string;
    person: {
        email: string;
    };
    name: string;
    avatar_url: string;
}

export interface INotionBlockDetailResponse {
    results: {
        id: string;
        created_time: string;
        last_edited_time: string;
        created_by: {
            object: 'user';
            id: string;
        };
        last_edited_by: {
            object: 'user';
            id: string;
        };
        has_children: boolean;
        archived: boolean;
        in_trash: boolean;
        type: TNotionBlockType,
        // a key here equal to type above containing the raw text
    }[];
    next_cursor: string | null;
    has_more: boolean;
    type: 'block';
}

export interface INotionTextData {
    rich_text: {
        plain_text: string;
    }[];
}

export enum TNotionBlockType {
    PARAGRAPH = 'paragraph',
    NUMBERED_LIST_ITEM = 'numbered_list_item',
}
