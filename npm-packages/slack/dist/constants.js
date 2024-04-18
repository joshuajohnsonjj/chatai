"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackRedisKey = exports.SlackErros = exports.SlackEndpoints = exports.SlackHeaders = exports.SlackBaseUrl = void 0;
exports.SlackBaseUrl = 'https://slack.com/api';
exports.SlackHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
};
var SlackEndpoints;
(function (SlackEndpoints) {
    SlackEndpoints["CONVERSATION_HISTORY"] = "/conversations.history";
    SlackEndpoints["CONVERSATION_LIST"] = "/conversations.list";
    SlackEndpoints["CONVERSATION_INFO"] = "/conversations.info";
    SlackEndpoints["USERS_LIST"] = "/users.list";
    SlackEndpoints["USER_INFO"] = "/users.info";
    SlackEndpoints["APP_ACTIVITY_LIST"] = "/apps.activities.list";
})(SlackEndpoints || (exports.SlackEndpoints = SlackEndpoints = {}));
var SlackErros;
(function (SlackErros) {
    SlackErros["ACCESS_DENIED"] = "access_denied";
    SlackErros["INVALID_APP_ID"] = "invalid_app_id";
    SlackErros["INVALID_APP"] = "invalid_app";
})(SlackErros || (exports.SlackErros = SlackErros = {}));
exports.SlackRedisKey = {
    USER: (id) => `SlackUser:${id}`,
    CHANNEL: (id) => `SlackChannel:${id}`,
};
