import app from '../src/app.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { seedDemoData } from '../src/seed/seedDemoData.js';

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await mongoose.connect(env.MONGO_URI);
    await seedDemoData();
    isConnected = true;
  }
  return app(req, res);
}
