import { Redis, RedisOptions } from 'ioredis';
import { env } from './env.js';

let isRedisConnected = false;

const isTls = env.REDIS_URL.startsWith('rediss://');

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required for serverless Redis like Upstash
  lazyConnect: true,
  connectTimeout: 4000,
  tls: isTls ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times) {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 1000, 2000);
  },
};

export const redisClient = new Redis(env.REDIS_URL, redisOptions);

redisClient.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ Connected to Redis successfully.');
});

redisClient.on('ready', () => {
  isRedisConnected = true;
});

redisClient.on('error', (err) => {
  isRedisConnected = false;
  // Non-fatal warning so missing Redis in testing or restricted environments doesn't crash the server
  if (env.NODE_ENV !== 'test') {
    console.warn('⚠️  Redis connection warning:', err.message);
  }
});

redisClient.on('close', () => {
  isRedisConnected = false;
});

export async function initRedis(): Promise<boolean> {
  if (env.ENABLE_REDIS === 'false') {
    return false;
  }

  // Prevent connecting to 127.0.0.1 / localhost when deployed to cloud environments like Render
  if (
    env.NODE_ENV === 'production' &&
    (env.REDIS_URL.includes('127.0.0.1') || env.REDIS_URL.includes('localhost'))
  ) {
    console.warn('⚠️  Local Redis URL configured in production. Operating in resilient fallback mode.');
    return false;
  }
  if (redisClient.status === 'ready' || redisClient.status === 'connect') {
    isRedisConnected = true;
    return true;
  }
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
    isRedisConnected = true;
    return true;
  } catch (err: any) {
    if ((redisClient.status as string) === 'ready' || (redisClient.status as string) === 'connect') {
      isRedisConnected = true;
      return true;
    }
    isRedisConnected = false;
    if (env.NODE_ENV !== 'test') {
      console.warn('⚠️  Redis could not connect on startup, operating in fallback mode:', err.message);
    }
    return false;
  }
}

export function isRedisAvailable(): boolean {
  return (
    (isRedisConnected || redisClient.status === 'ready') &&
    redisClient.status !== 'close' &&
    redisClient.status !== 'end' &&
    redisClient.status !== 'wait'
  );
}
