import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';
import { seedDemoData } from './seed/seedDemoData.js';

async function startServer() {
  try {
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');

    await seedDemoData();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

startServer();
