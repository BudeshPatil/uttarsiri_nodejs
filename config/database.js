import dns from 'dns';
import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Node's DNS (c-ares) often fails with querySrv ECONNREFUSED on corporate/
 * Windows resolvers even when system nslookup works. Prefer public DNS for
 * mongodb+srv:// lookups so Atlas SRV records resolve reliably.
 */
const ensureReliableDnsForAtlas = (uri) => {
  if (!uri.includes('mongodb+srv://')) return;

  try {
    const current = dns.getServers();
    const preferred = ['8.8.8.8', '1.1.1.1'];
    const merged = [...new Set([...preferred, ...current])];
    dns.setServers(merged);
    logger.info('DNS servers configured for Atlas SRV lookup', { servers: merged });
  } catch (err) {
    logger.warn('Unable to override DNS servers', { message: err.message });
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

    await mongoose.connect(trimmedUri, {
      family: 4, // Prefer IPv4; avoids flaky IPv6 paths on some networks
    });

    logger.info('MongoDB Connected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  } catch (error) {
    logger.error('MongoDB Connection Error', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

export default connectDB;
