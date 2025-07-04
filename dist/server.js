"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("@/app"));
const logger_1 = __importDefault(require("@/utils/logger"));
// handling uncaught exceptions--
process.on('uncaughtException', (err) => {
    logger_1.default.error(`Error: ${err.message} | Stack: ${err.stack}`);
    logger_1.default.error(`Shutting down the server due to uncaught exception!`);
    process.exit(1);
});
// server--
const server = app_1.default.listen(process.env.PORT, () => {
    logger_1.default.info(`Server listening on port ${process.env.PORT}`);
});
// unhandled promise rejection--
process.on('unhandledRejection', (err) => {
    logger_1.default.error(`Error: ${err}`);
    logger_1.default.error(`Shutting down the server due to unhandled promise rejection!`);
    server.close(() => {
        process.exit(1);
    });
});
