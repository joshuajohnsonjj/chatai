"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TSlackChannelType = exports.TSlackEndpoints = exports.SlackHeaders = exports.SlackBaseUrl = void 0;
exports.SlackBaseUrl = 'https://slack.com/api';
exports.SlackHeaders = {
    'Content-Type': 'application/json',
};
var TSlackEndpoints;
(function (TSlackEndpoints) {
    TSlackEndpoints["CONVERSATION_HISTORY"] = "/conversations.history";
    TSlackEndpoints["CONVERSATION_LIST"] = "/conversations.list";
})(TSlackEndpoints || (exports.TSlackEndpoints = TSlackEndpoints = {}));
var TSlackChannelType;
(function (TSlackChannelType) {
    TSlackChannelType["PUBLIC"] = "public_channel";
    TSlackChannelType["PRIVATE"] = "private_channel";
    TSlackChannelType["MULTI_DM"] = "mpim";
    TSlackChannelType["DM"] = "im";
})(TSlackChannelType || (exports.TSlackChannelType = TSlackChannelType = {}));
