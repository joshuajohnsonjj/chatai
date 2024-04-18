"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantDataSource = exports.TQdrantPayloadKey = void 0;
var TQdrantPayloadKey;
(function (TQdrantPayloadKey) {
    TQdrantPayloadKey["TEXT"] = "text";
    TQdrantPayloadKey["ENTITY_ID"] = "ownerEntityId";
    TQdrantPayloadKey["DATASOURCE_ID"] = "dataSourceId";
})(TQdrantPayloadKey || (exports.TQdrantPayloadKey = TQdrantPayloadKey = {}));
var QdrantDataSource;
(function (QdrantDataSource) {
    QdrantDataSource["NOTION"] = "notion";
    QdrantDataSource["SLACK"] = "slack";
})(QdrantDataSource || (exports.QdrantDataSource = QdrantDataSource = {}));
