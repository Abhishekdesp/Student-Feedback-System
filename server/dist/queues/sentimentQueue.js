import { Queue } from 'bullmq';
import { redisClient, isRedisAvailable } from '../config/redis.js';
import { AISentimentService } from '../services/aiSentimentService.js';
import { Response } from '../models/Response.js';
import { CacheService } from '../services/cacheService.js';
export const SENTIMENT_QUEUE_NAME = 'sentiment-analysis';
export const sentimentQueue = new Queue(SENTIMENT_QUEUE_NAME, {
    connection: redisClient,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
/**
 * Dispatches sentiment analysis either asynchronously via BullMQ or falls back to synchronous processing
 */
export async function dispatchSentimentJob(responseId, comment) {
    if (!comment || !comment.trim())
        return;
    if (isRedisAvailable()) {
        try {
            await sentimentQueue.add('analyze-sentiment', {
                responseId,
                comment: comment.trim(),
            });
            console.log(`[BullMQ] Enqueued sentiment job for response ${responseId}`);
            return;
        }
        catch (err) {
            console.warn(`[BullMQ] Enqueue failed, falling back to sync execution:`, err.message);
        }
    }
    // Graceful fallback when Redis is absent
    try {
        const sentiment = await AISentimentService.analyzeSentiment(comment.trim());
        await Response.findByIdAndUpdate(responseId, { sentiment });
        await CacheService.delByPattern('teacher:*');
    }
    catch (err) {
        console.error(`[Fallback] Sync sentiment analysis failed:`, err);
    }
}
