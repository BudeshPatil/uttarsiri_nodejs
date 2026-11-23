import dotenv from 'dotenv';

dotenv.config();

const appConfig = {
  port: process.env.PORT || 5004,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '60m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    resetExpiry: process.env.JWT_RESET_EXPIRY || '1h',
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5104',
  uploadDir: process.env.UPLOAD_DIR || './public/uploads',
  mongodbUri: process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_CONNECT,
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  },
  payments: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
    codEnabled: !['0', 'false', 'no', 'off'].includes(
      String(process.env.COD_ENABLED ?? 'true').trim().toLowerCase(),
    ),
  },
};

export default appConfig;
