import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { seedDemoData } from './seed/seedDemoData.js';
import { initRedis, redisClient } from './config/redis.js';
import { startSentimentWorker } from './workers/sentimentWorker.js';
import { startImportWorker } from './workers/importWorker.js';
async function startServer() {
    try {
        // 1. Immediately bind and listen to PORT so Render/cloud platforms detect the port in <1s
        const server = app.listen(env.PORT, '0.0.0.0', () => {
            console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode.`);
        });
        // 2. Connect to MongoDB with 10s timeout
        console.log('Connecting to MongoDB database...');
        await mongoose.connect(env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log('✅ Connected to MongoDB successfully.');
        // 3. Initialize Redis & BullMQ Workers asynchronously without blocking HTTP requests
        initRedis()
            .then((redisOk) => {
            if (redisOk) {
                startSentimentWorker();
                startImportWorker();
                console.log('⚡ BullMQ background workers initialized (sentiment-analysis, student-import).');
            }
        })
            .catch((err) => {
            console.warn('⚠️  Redis non-fatal startup error:', err.message);
        });
        // 4. Seed demo data asynchronously in the background so it never blocks login or health checks
        seedDemoData().catch((err) => {
            console.warn('⚠️  Demo data seed error:', err.message);
        });
        const handleShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
            server.close(async () => {
                try {
                    await mongoose.connection.close();
                    if (redisClient.status === 'ready' || redisClient.status === 'connect') {
                        await redisClient.quit();
                    }
                    console.log('Connections closed cleanly. Process exiting.');
                    process.exit(0);
                }
                catch (err) {
                    console.error('Error during shutdown:', err);
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGINT', () => handleShutdown('SIGINT'));
    }
    catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
}
startServer();
