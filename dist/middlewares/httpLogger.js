"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_http_1 = __importDefault(require("pino-http"));
const logger_1 = __importDefault(require("@/utils/logger"));
const httpLogger = (0, pino_http_1.default)({
    logger: logger_1.default,
    customSuccessMessage: function (res) {
        if (res.statusCode === 404)
            return 'resource not found';
        return 'request completed';
    },
    customErrorMessage: function (error, res) {
        return `request errored with status code: ${res.statusCode}`;
    },
    serializers: {
        req(req) {
            return {
                method: req.method,
                url: req.url,
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
});
exports.default = httpLogger;
