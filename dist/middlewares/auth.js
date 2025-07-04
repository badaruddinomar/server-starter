"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authMiddleware = void 0;
const appError_1 = require("@/utils/appError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("@/config"));
const http_status_1 = __importDefault(require("http-status"));
const prismaClient_1 = require("@/utils/prismaClient");
const authMiddleware = async (req, _res, next) => {
    const token = req.cookies.token;
    if (!token) {
        throw new appError_1.AppError('Please login to access this resource.', http_status_1.default.UNAUTHORIZED);
    }
    const decodedData = jsonwebtoken_1.default.verify(token, config_1.default.jwt_secret);
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { id: decodedData?.userId },
    });
    if (!user) {
        throw new appError_1.AppError('User no longer exists. Please login again.', http_status_1.default.UNAUTHORIZED);
    }
    if (!user.isVerified) {
        throw new appError_1.AppError('Please verify your email.', http_status_1.default.UNAUTHORIZED);
    }
    req.user = user;
    next();
};
exports.authMiddleware = authMiddleware;
// Authorize Roles--
const authorizeRoles = (...roles) => {
    return (req, _res, next) => {
        if (!roles.includes(req.user?.role)) {
            throw new appError_1.AppError(`Role ${req.user?.role} is not allowed to access this resource.`, http_status_1.default.FORBIDDEN);
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
