import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // default time-to-live in seconds
  checkperiod: 60, // interval to check & delete expired cache
});

export const getCache = (key: string) => {
  return cache.get(key);
};

export const setCache = <T>(key: string, value: T, ttlInSec: number = 300) => {
  cache.set(key, value, ttlInSec);
};

export const invalidateCache = (key: string) => {
  cache.del(key);
};
