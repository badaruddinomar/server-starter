"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = require("@/generated/prisma");
let prisma;
// Ensure only one instance of PrismaClient is created (Singleton Pattern)
if (process.env.NODE_ENV === 'production') {
    exports.prisma = prisma = new prisma_1.PrismaClient();
}
else {
    // For development, re-use Prisma Client to prevent new instances on every hot reload
    if (!global.prisma) {
        global.prisma = new prisma_1.PrismaClient();
    }
    exports.prisma = prisma = global.prisma;
}
