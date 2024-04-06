"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionEndpointMethods = exports.NotionEndpoints = exports.NotionHeaders = exports.NotionBaseUrl = void 0;
exports.NotionBaseUrl = 'https://api.notion.com';
exports.NotionHeaders = {
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
};
exports.NotionEndpoints = {
    SEARCH: '/v1/search',
    BLOCK_DETAIL: (blockId) => `/v1/blocks/${blockId}/children?page_size=100`,
    BLOCK_DETAIL_WITH_CURSOR: (blockId, cursor) => `/v1/blocks/${blockId}/children?page_size=100&cursor=${cursor}`,
};
var NotionEndpointMethods;
(function (NotionEndpointMethods) {
    NotionEndpointMethods["SEARCH"] = "post";
    NotionEndpointMethods["BLOCK_DETAIL"] = "get";
})(NotionEndpointMethods || (exports.NotionEndpointMethods = NotionEndpointMethods = {}));
