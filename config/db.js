import dns from 'dns';
import mongoose from 'mongoose';
import logger from './logger.js';

const ensureReliableDnsForAtlas = (uri) => {
  if (!uri.includes('mongodb+srv://')) return;

  try {
    const current = dns.getServers();
    const preferred = ['8.8.8.8', '1.1.1.1'];
    dns.setServers([...new Set([...preferred, ...current])]);
  } catch {
    // non-fatal
  }
};

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_CONNECT;

    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const trimmedUri = uri.trim();
    ensureReliableDnsForAtlas(trimmedUri);

    const connect = await mongoose.connect(trimmedUri, { family: 4 });
    logger.info('mongodb is connected successfully');
    return connect;
  } catch (err) {
    logger.error('MongoDB connection error', { message: err.message });
    throw err;
  }
};

export default connectDB;
