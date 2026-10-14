import { Queue } from 'bullmq';
import { redisClient, isRedisAvailable } from '../config/redis.js';

export interface StudentImportJobData {
  csvContent: string;
  defaultYear?: 'First' | 'Second' | 'Third';
}

export const IMPORT_QUEUE_NAME = 'student-import';

export const importQueue = new Queue<StudentImportJobData>(IMPORT_QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function dispatchStudentImportJob(csvContent: string, defaultYear: 'First' | 'Second' | 'Third' = 'Third') {
  if (isRedisAvailable()) {
    try {
      const job = await importQueue.add('batch-import', { csvContent, defaultYear });
      return { isQueued: true, jobId: job.id };
    } catch (err: any) {
      console.warn('[BullMQ] Student import queue error, falling back to direct import:', err.message);
    }
  }
  return { isQueued: false };
}
