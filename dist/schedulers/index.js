"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulars = void 0;
const removeUnverifiedAccounts_1 = require("./removeUnverifiedAccounts");
const schedulars = () => {
    (0, removeUnverifiedAccounts_1.removeUnverifiedAccounts)();
};
exports.schedulars = schedulars;
