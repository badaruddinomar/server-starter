"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_autogen_1 = __importDefault(require("swagger-autogen"));
const path_1 = __importDefault(require("path"));
const doc = {
    info: {
        title: 'Server Starter API',
        description: 'API documentation',
    },
    host: 'localhost:4000',
    schemes: ['http'],
};
const outputFile = path_1.default.resolve(__dirname, '../docs/swagger-output.json');
const endpointsFiles = ['../app.ts'];
(0, swagger_autogen_1.default)()(outputFile, endpointsFiles, doc);
