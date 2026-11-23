import dotenv from 'dotenv';

dotenv.config();

const truthy = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  currency: process.env.RAZORPAY_CURRENCY || 'INR',
  codEnabled: truthy(process.env.COD_ENABLED, true),
};

export const isRazorpayConfigured = () =>
  Boolean(razorpayConfig.keyId && razorpayConfig.keySecret);

export default razorpayConfig;
