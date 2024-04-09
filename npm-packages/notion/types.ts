/**
 * 
 * Requests payloads/responses
 * 
 */
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
    object: 'list';
    results: INotionPageDetailResponse[];
    next_cursor: string | null;
    has_more: boolean;
}

export interface INotionPageDetailResponse {
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

export interface NotionBlockDetailResponse {
    results: NotionBlock[];
    next_cursor: string | null;
    has_more: boolean;
    type: 'block';
}

/**
 * 
 * Notion data types
 * 
 */
export enum NotionBlockType {
    PARAGRAPH = 'paragraph',
    NUMBERED_LIST_ITEM = 'numbered_list_item',
    BULLETED_LIST_ITEM = 'bulleted_list_item',
    CALLOUT = 'callout',
    CODE = 'code',
    COLUMN_LIST = 'column_list',
    COLUMN = 'column',
    EMBED = 'embed',
    EQUATION = 'equation',
    HEADING_1 = 'heading_1',
    HEADING_2 = 'heading_2',
    HEADING_3 = 'heading_3',
    QUOTE = 'quote',
    TABLE = 'table',
    TABLE_ROW = 'table_row',
    TO_DO = 'to_do',
    TOGGLE = 'toggle',
}

export interface NotionBlock {
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
    type: NotionBlockType,
    [typeData: string]: NotionBlockData // a key here equal to type above containing the raw text
}

export type NotionBlockData = NotionParagraph | NotionNumberedListItem | NotionBulletedListItem | NotionCallout | NotionQuote | NotionToggle | INotionHeading1 | INotionHeading2 | INotionHeading3 | NotionCode | NotionEquation | NotionToDo | NotionColumn | NotionColumnList | NotionTable | NotionTableRow;

export type NotionParagraph = NotionBaseDataStore;
export type NotionNumberedListItem = NotionBaseDataStore;
export type NotionBulletedListItem = NotionBaseDataStore;
export type NotionCallout = NotionBaseDataStore;
export type NotionQuote = NotionBaseDataStore;
export type NotionToggle = NotionBaseDataStore;
export type INotionHeading1 = NotionHeading;
export type INotionHeading2 = NotionHeading;
export type INotionHeading3 = NotionHeading;

export interface NotionCode {
    caption: NotionRichTextData[];
    rich_text: NotionRichTextData[];
    language: string;
}

export interface NotionEquation {
    expression: string;
}

export interface NotionToDo {
    rich_text: NotionRichTextData[];
    children: NotionBlock[];
    checked: boolean;
}

// TODO:
export interface NotionColumnList {
}
export interface NotionColumn {
}
export interface NotionTable {
}
export interface NotionTableRow {
}

export interface NotionBaseDataStore {
    rich_text: NotionRichTextData[];
    children: NotionBlock[];
}

export interface NotionHeading {
    rich_text: NotionRichTextData[];
}

export interface NotionRichTextData {
    type: 'text';
    text: {
        content: string;
        link: string | null;
    };
    annotations: any;
    plain_text: string;
    href: string | null;
};
