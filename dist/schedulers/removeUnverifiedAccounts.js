"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUnverifiedAccounts = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prismaClient_1 = require("../utils/prismaClient");
const removeUnverifiedAccounts = () => {
    node_cron_1.default.schedule('*/30 * * * *', async () => {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        await prismaClient_1.prisma.user.deleteMany({
            where: {
                isVerified: false,
                createdAt: { lt: thirtyMinutesAgo },
            },
        });
    });
};
exports.removeUnverifiedAccounts = removeUnverifiedAccounts;
