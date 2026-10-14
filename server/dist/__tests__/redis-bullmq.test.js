import request from 'supertest';
import app from '../app.js';
import { CacheService } from '../services/cacheService.js';
import { initRedis } from '../config/redis.js';
import { sentimentQueue } from '../queues/sentimentQueue.js';
import { dispatchStudentImportJob, importQueue } from '../queues/importQueue.js';
describe('Redis & BullMQ Architecture Integration Tests', () => {
    beforeAll(async () => {
        await initRedis();
    });
    afterAll(async () => {
        await sentimentQueue.close();
        await importQueue.close();
    });
    describe('CacheService (Cache-Aside & Keys)', () => {
        it('sets, gets, and deletes keys in Redis properly', async () => {
            const testKey = 'test:analytics:subject-123';
            const testData = { subjectId: 'subject-123', averageRating: 4.85, totalResponses: 42 };
            await CacheService.set(testKey, testData, 60);
            const cached = await CacheService.get(testKey);
            expect(cached).not.toBeNull();
            expect(cached?.subjectId).toBe('subject-123');
            expect(cached?.averageRating).toBe(4.85);
            await CacheService.del(testKey);
            const afterDel = await CacheService.get(testKey);
            expect(afterDel).toBeNull();
        });
        it('invalidates keys matching pattern', async () => {
            await CacheService.set('test:pattern:1', { val: 1 }, 60);
            await CacheService.set('test:pattern:2', { val: 2 }, 60);
            expect(await CacheService.get('test:pattern:1')).not.toBeNull();
            await CacheService.delByPattern('test:pattern:*');
            // Wait brief moment for pipeline to execute
            await new Promise((resolve) => setTimeout(resolve, 100));
            const val1 = await CacheService.get('test:pattern:1');
            const val2 = await CacheService.get('test:pattern:2');
            expect(val1).toBeNull();
            expect(val2).toBeNull();
        });
    });
    describe('Token Blacklisting on Revocation/Logout', () => {
        it('correctly marks token as blacklisted and detects revocation', async () => {
            const dummyToken = `dummy-jwt-token-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            expect(await CacheService.isTokenBlacklisted(dummyToken)).toBe(false);
            await CacheService.blacklistToken(dummyToken, 30);
            expect(await CacheService.isTokenBlacklisted(dummyToken)).toBe(true);
            // Supertest check: Request using revoked token should receive 401
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${dummyToken}`);
            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/revoked/i);
            // Clean up token from Redis
            await CacheService.del(`blacklist:${dummyToken}`);
        });
    });
    describe('BullMQ Queue Job Dispatching', () => {
        it('dispatches sentiment analysis job to sentimentQueue', async () => {
            const job = await sentimentQueue.add('test-sentiment', {
                responseId: 'resp-999',
                comment: 'The professor explains difficult concepts with great clarity!',
            });
            expect(job.id).toBeDefined();
            expect(job.name).toBe('test-sentiment');
            expect(job.data.responseId).toBe('resp-999');
            try {
                await job.remove();
            }
            catch {
                // Job might be locked/processed by active background worker
            }
        });
        it('dispatches student CSV import job to importQueue', async () => {
            const result = await dispatchStudentImportJob('PRN,Roll,Name\n101,1,Alice Smith', 'Third');
            expect(result).toHaveProperty('isQueued');
            if (result.isQueued) {
                expect(result.jobId).toBeDefined();
                const job = await importQueue.getJob(result.jobId);
                if (job) {
                    try {
                        await job.remove();
                    }
                    catch {
                        // Job might be locked/processed by active background worker
                    }
                }
            }
        });
    });
});
