import { Queue } from 'bullmq';
import { redisClient, isRedisAvailable } from '../config/redis.js';
export const IMPORT_QUEUE_NAME = 'student-import';
export const importQueue = new Queue(IMPORT_QUEUE_NAME, {
    connection: redisClient,
    defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,
    },
});
export async function dispatchStudentImportJob(csvContent, defaultYear = 'Third') {
    if (isRedisAvailable()) {
        try {
            const job = await importQueue.add('batch-import', { csvContent, defaultYear });
            return { isQueued: true, jobId: job.id };
        }
        catch (err) {
            console.warn('[BullMQ] Student import queue error, falling back to direct import:', err.message);
        }
    }
    return { isQueued: false };
}
