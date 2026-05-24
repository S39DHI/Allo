import { Redis } from '@upstash/redis';

interface GlobalWithRedis {
  redis?: Redis | null;
}

const globalForRedis = globalThis as unknown as GlobalWithRedis;

export const redis =
  globalForRedis.redis ??
  (process.env.REDIS_URL && process.env.REDIS_TOKEN
    ? new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      })
    : null);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
