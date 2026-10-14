import { Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { SENTIMENT_QUEUE_NAME, SentimentJobData } from '../queues/sentimentQueue.js';
import { AISentimentService } from '../services/aiSentimentService.js';
import { Response } from '../models/Response.js';
import { CacheService } from '../services/cacheService.js';

let sentimentWorker: Worker<SentimentJobData> | null = null;

export function startSentimentWorker() {
  if (sentimentWorker) return sentimentWorker;

  sentimentWorker = new Worker<SentimentJobData>(
    SENTIMENT_QUEUE_NAME,
    async (job: Job<SentimentJobData>) => {
      const { responseId, comment } = job.data;
      console.log(`[BullMQ Worker] Processing sentiment for response: ${responseId}`);

      const sentiment = await AISentimentService.analyzeSentiment(comment);

      await Response.findByIdAndUpdate(responseId, { sentiment });

      // Invalidate relevant teacher dashboard and subject caches
      await CacheService.delByPattern('teacher:*');
      await CacheService.delByPattern('subject:*');

      console.log(`[BullMQ Worker] Sentiment completed for ${responseId}: ${sentiment.label} (${sentiment.engine})`);
      return { success: true, sentiment };
    },
    {
      connection: redisClient,
      concurrency: 5, // Process up to 5 concurrent LLM sentiment analyses
    }
  );

  sentimentWorker.on('completed', (job) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed successfully.`);
  });

  sentimentWorker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
  });

  return sentimentWorker;
}
