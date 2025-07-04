"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const validator = (schemas) => {
    return async (req, res, next) => {
        const errors = {};
        //  Validate body
        if (schemas.body) {
            const bodyResult = await schemas.body.safeParseAsync(req.body);
            if (!bodyResult.success) {
                errors.body = bodyResult.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
            }
            else {
                req.body = bodyResult.data;
            }
        }
        // Validate query
        if (schemas.query) {
            const queryResult = await schemas.query.safeParseAsync(req.query);
            if (!queryResult.success) {
                errors.query = queryResult.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
            }
            else {
                req.query = queryResult.data;
            }
        }
        // Validate params
        if (schemas.params) {
            const paramsResult = await schemas.params.safeParseAsync(req.params);
            if (!paramsResult.success) {
                errors.params = paramsResult.error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
            }
            else {
                req.params = paramsResult.data;
            }
        }
        //  If any errors, respond with 400
        if (Object.keys(errors).length > 0) {
            res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: 'VALIDATION FAILED',
                errors: errors,
            });
            return;
        }
        next();
    };
};
exports.default = validator;
