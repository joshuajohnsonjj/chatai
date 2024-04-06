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
    
}
  