import { z } from 'zod';
import { validate } from './auth.validator.js';
import { DELIVERY_OPTIONS, PAYMENT_METHODS } from '../constants/order.constants.js';

export const checkoutQuoteSchema = z.object({
  body: z.object({
    address_id: z.string().uuid().optional(),
    delivery_option: z.enum([DELIVERY_OPTIONS.STANDARD, DELIVERY_OPTIONS.EXPRESS]).optional(),
    language: z.enum(['en', 'kn', 'hi']).optional(),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    address_id: z.string().uuid(),
    delivery_option: z.enum([DELIVERY_OPTIONS.STANDARD, DELIVERY_OPTIONS.EXPRESS]).optional(),
    payment_method: z
      .enum([
        PAYMENT_METHODS.COD,
        PAYMENT_METHODS.UPI,
        PAYMENT_METHODS.CARD,
        PAYMENT_METHODS.NETBANKING,
      ])
      .optional(),
    language: z.enum(['en', 'kn', 'hi']).optional(),
    idempotency_key: z.string().min(8).max(100).optional(),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const cancelOrderSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().max(300).optional(),
  }),
});

export { validate };
export default { validate, checkoutQuoteSchema, createOrderSchema, orderIdSchema, cancelOrderSchema };
