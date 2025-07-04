"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = exports.setCache = exports.getCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({
    stdTTL: 300, // default time-to-live in seconds
    checkperiod: 60, // interval to check & delete expired cache
});
const getCache = (key) => {
    return cache.get(key);
};
exports.getCache = getCache;
const setCache = (key, value, ttlInSec = 300) => {
    cache.set(key, value, ttlInSec);
};
exports.setCache = setCache;
const invalidateCache = (key) => {
    cache.del(key);
};
exports.invalidateCache = invalidateCache;
