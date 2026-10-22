import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { seedDemoData } from './seed/seedDemoData.js';
import { initRedis, redisClient } from './config/redis.js';
import { startSentimentWorker } from './workers/sentimentWorker.js';
import { startImportWorker } from './workers/importWorker.js';

async function startServer() {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  });

  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');

    // Initialize Redis & BullMQ Workers
    try {
      const redisOk = await initRedis();
      if (redisOk) {
        startSentimentWorker();
        startImportWorker();
        console.log('⚡ BullMQ background workers initialized (sentiment-analysis, student-import).');
      }
    } catch (redisErr: any) {
      console.warn('⚠️  Redis initialization warning (non-fatal):', redisErr?.message);
    }

    try {
      await seedDemoData();
    } catch (seedErr: any) {
      console.warn('⚠️  Seed data warning (non-fatal):', seedErr?.message);
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }

    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          if (redisClient.status === 'ready' || redisClient.status === 'connect') {
            await redisClient.quit();
          }
          console.log('Connections closed cleanly. Process exiting.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  }

startServer();

