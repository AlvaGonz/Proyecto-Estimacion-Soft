import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async (): Promise<void> => {
    // TODO: Uncomment when ready to connect to MongoDB
    /*
    try {
      await mongoose.connect(env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
  
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });
  
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
    */

    console.log('[STUB] Database connection skipped (not implemented yet)');
};
