import { z } from 'zod';
import { validate } from './auth.validator.js';
import { PAYMENT_METHODS } from '../constants/order.constants.js';
import { ONLINE_PAYMENT_METHODS } from '../constants/payment.constants.js';

export const createPaymentSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
    payment_method: z.enum(ONLINE_PAYMENT_METHODS).optional(),
    idempotency_key: z.string().min(8).max(100).optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
    razorpay_order_id: z.string().min(3),
    razorpay_payment_id: z.string().min(3),
    razorpay_signature: z.string().min(10),
  }),
});

export const failPaymentSchema = z.object({
  body: z.object({
    order_id: z.string().uuid(),
    reason: z.string().max(300).optional(),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    order_id: z.string().uuid().optional(),
    payment_id: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    reason: z.string().max(300).optional(),
  }).refine((data) => data.order_id || data.payment_id, {
    message: 'order_id or payment_id is required',
  }),
});

export const paymentOrderIdSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});

export { validate, PAYMENT_METHODS };
export default {
  validate,
  createPaymentSchema,
  verifyPaymentSchema,
  failPaymentSchema,
  refundPaymentSchema,
  paymentOrderIdSchema,
};
