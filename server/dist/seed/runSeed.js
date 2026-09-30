import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { seedDemoData } from './seedDemoData.js';
async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(env.MONGO_URI);
        await seedDemoData();
        console.log('Seeding complete.');
        process.exit(0);
    }
    catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}
main();
