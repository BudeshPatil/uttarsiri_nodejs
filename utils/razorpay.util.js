import crypto from 'crypto';
import Razorpay from 'razorpay';
import razorpayConfig, { isRazorpayConfigured } from '../config/razorpay.config.js';
import AppError from './appError.util.js';
import { PAYMENT_MESSAGES } from '../constants/payment.constants.js';
import { HTTP_STATUS, ERROR_CODES } from '../constants/error.constants.js';

let client;

export const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      PAYMENT_MESSAGES.RAZORPAY_NOT_CONFIGURED,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
    );
  }
  if (!client) {
    client = new Razorpay({
      key_id: razorpayConfig.keyId,
      key_secret: razorpayConfig.keySecret,
    });
  }
  return client;
};

/** Convert INR rupees to paise for Razorpay. */
export const toPaise = (amountInr) => Math.round(Number(amountInr || 0) * 100);

export const fromPaise = (amountPaise) => Math.round(Number(amountPaise || 0)) / 100;

export const verifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!razorpayConfig.keySecret) return false;
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', razorpayConfig.keySecret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpay_signature || '')));
  } catch {
    return false;
  }
};

export const verifyWebhookSignature = (rawBody, signature) => {
  if (!razorpayConfig.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', razorpayConfig.webhookSecret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature || '')));
  } catch {
    return false;
  }
};

export default {
  getRazorpayClient,
  toPaise,
  fromPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
  isRazorpayConfigured,
};
