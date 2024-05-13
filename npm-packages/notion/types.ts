/**
 *
 * Requests payloads/responses
 *
 */
export interface NotionSearchPayload {
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

export interface NotionSearchResponse {
    object: 'list';
    results: NotionPageDetailResponse[];
    next_cursor: string | null;
    has_more: boolean;
}

export interface NotionPageDetailResponse {
    object: 'page' | 'database';
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: NotionAuthorAttribution;
    last_edited_by: NotionAuthorAttribution;
    parent: {
        type: string;
        database_id: string;
    };
    properties: {
        title?: {
            id: 'title';
            type: 'title';
            title: NotionRichTextData[];
        };
        Name?: {
            id: 'title';
            type: 'title';
            title?: NotionRichTextData[];
        };
    };
    archived: boolean;
    in_trash: boolean;
    url: string;
    public_url: string;
}

export interface NotionUserDetailResponse {
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
    object: 'list';
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

export interface NotionAuthorAttribution {
    object: 'user' | 'bot';
    id: string;
}

export interface NotionBlock {
    id: string;
    created_time: string;
    last_edited_time: string;
    created_by: NotionAuthorAttribution;
    last_edited_by: NotionAuthorAttribution
    has_children: boolean;
    archived: boolean;
    in_trash: boolean;
    type: NotionBlockType;
    [typeData: string]: unknown; // a key here equal to type above containing the raw text
}

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
    checked: boolean;
}

export interface NotionTable {
    table_width: number;
    has_column_header: boolean;
    has_row_header: boolean;
}

export interface NotionTableRow {
    cells: NotionRichTextData[][];
}

export interface NotionBaseDataStore {
    rich_text: NotionRichTextData[];
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
    annotations: unknown;
    plain_text: string;
    href: string | null;
}

/**
 *
 * SQS types
 *
 */
export interface NotionSQSMessageBody {
    pageId: string;
    pageUrl: string;
    ownerEntityId: string;
    pageTitle: string;
    secret: string;
    dataSourceId: string;
    isFinal: boolean;
}
