"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionBlockType = void 0;
/**
 *
 * Notion data types
 *
 */
var NotionBlockType;
(function (NotionBlockType) {
    NotionBlockType["PARAGRAPH"] = "paragraph";
    NotionBlockType["NUMBERED_LIST_ITEM"] = "numbered_list_item";
    NotionBlockType["BULLETED_LIST_ITEM"] = "bulleted_list_item";
    NotionBlockType["CALLOUT"] = "callout";
    NotionBlockType["CODE"] = "code";
    NotionBlockType["COLUMN_LIST"] = "column_list";
    NotionBlockType["COLUMN"] = "column";
    NotionBlockType["EMBED"] = "embed";
    NotionBlockType["EQUATION"] = "equation";
    NotionBlockType["HEADING_1"] = "heading_1";
    NotionBlockType["HEADING_2"] = "heading_2";
    NotionBlockType["HEADING_3"] = "heading_3";
    NotionBlockType["QUOTE"] = "quote";
    NotionBlockType["TABLE"] = "table";
    NotionBlockType["TABLE_ROW"] = "table_row";
    NotionBlockType["TO_DO"] = "to_do";
    NotionBlockType["TOGGLE"] = "toggle";
})(NotionBlockType || (exports.NotionBlockType = NotionBlockType = {}));
