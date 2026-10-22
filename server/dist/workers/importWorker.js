import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import { IMPORT_QUEUE_NAME } from '../queues/importQueue.js';
import { StudentService } from '../services/studentService.js';
let importWorker = null;
export function startImportWorker() {
    if (importWorker)
        return importWorker;
    importWorker = new Worker(IMPORT_QUEUE_NAME, async (job) => {
        console.log(`[BullMQ Worker] Processing batch student CSV import job: ${job.id}`);
        const { csvContent, defaultYear } = job.data;
        const result = await StudentService.importStudentsFromCSV(csvContent, defaultYear);
        console.log(`[BullMQ Worker] Successfully imported ${result.importedCount} students in job ${job.id}`);
        return result;
    }, {
        connection: redisClient,
        concurrency: 2,
    });
    importWorker.on('completed', (job) => {
        console.log(`[BullMQ Worker] Student import job ${job.id} completed.`);
    });
    importWorker.on('failed', (job, err) => {
        console.error(`[BullMQ Worker] Student import job ${job?.id} failed:`, err.message);
    });
    importWorker.on('error', (err) => {
        console.warn('[BullMQ Worker] Student import worker warning:', err.message);
    });
    return importWorker;
}
