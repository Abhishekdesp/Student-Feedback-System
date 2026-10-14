import { redisClient, isRedisAvailable } from '../config/redis.js';

export class CacheService {
  /**
   * Get parsed JSON value from Redis
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) return null;
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err: any) {
      console.warn(`[CacheService] Failed to get key "${key}":`, err.message);
      return null;
    }
  }

  /**
   * Set key with TTL in seconds
   */
  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (err: any) {
      console.warn(`[CacheService] Failed to set key "${key}":`, err.message);
    }
  }

  /**
   * Delete a specific key
   */
  static async del(key: string): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      await redisClient.del(key);
    } catch (err: any) {
      console.warn(`[CacheService] Failed to del key "${key}":`, err.message);
    }
  }

  /**
   * Delete keys matching pattern, e.g. "teacher:analytics:*"
   */
  static async delByPattern(pattern: string): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      const stream = redisClient.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          const pipeline = redisClient.pipeline();
          keys.forEach((k) => pipeline.del(k));
          await pipeline.exec();
        }
      });
    } catch (err: any) {
      console.warn(`[CacheService] Failed to delete pattern "${pattern}":`, err.message);
    }
  }

  /**
   * Token Blacklisting on Logout
   */
  static async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (!isRedisAvailable()) return;
    try {
      await redisClient.set(`blacklist:${token}`, '1', 'EX', Math.max(1, ttlSeconds));
    } catch (err: any) {
      console.warn('[CacheService] Failed to blacklist token:', err.message);
    }
  }

  static async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!isRedisAvailable()) return false;
    try {
      const exists = await redisClient.get(`blacklist:${token}`);
      return Boolean(exists);
    } catch (err: any) {
      return false;
    }
  }
}
