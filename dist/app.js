"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const notFound_1 = __importDefault(require("@/middlewares/notFound"));
const errorHandler_1 = require("@/middlewares/errorHandler");
const auth_routes_1 = __importDefault(require("@/modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("@/modules/user/user.routes"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const rateLimiter_1 = require("@/middlewares/rateLimiter");
const config_1 = __importDefault(require("@/config"));
const schedulers_1 = require("@/schedulers");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_output_json_1 = __importDefault(require("@/docs/swagger-output.json"));
const http_status_1 = __importDefault(require("http-status"));
const app = (0, express_1.default)();
const corsOptions = {
    origin: config_1.default.client_url,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
// middleware--
app.use(express_1.default.json());
app.use((0, cors_1.default)(corsOptions));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use((0, express_fileupload_1.default)({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.set('trust proxy', 1);
app.use((0, rateLimiter_1.rateLimiter)(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
(0, schedulers_1.schedulars)();
// routes--
app.get('/', (_req, res) => {
    res.send('Hello World!');
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', user_routes_1.default);
// Health check route
app.get('/health', (_req, res) => {
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});
// Swagger docs route
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_output_json_1.default));
// not found middleware
app.use(notFound_1.default);
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
