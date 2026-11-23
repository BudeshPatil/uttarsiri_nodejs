import { z } from 'zod';
import { validate } from './auth.validator.js';
import { COUPON_STATUS, COUPON_TYPES } from '../constants/coupon.constants.js';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(40),
    description: z.string().max(300).optional(),
    discount_type: z.enum([COUPON_TYPES.PERCENTAGE, COUPON_TYPES.FIXED]),
    discount_value: z.coerce.number().positive(),
    minimum_order_amount: z.coerce.number().min(0).optional(),
    max_discount_amount: z.coerce.number().positive().nullable().optional(),
    usage_limit: z.coerce.number().int().positive().nullable().optional(),
    per_user_limit: z.coerce.number().int().positive().optional(),
    starts_at: z.string().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    status: z.enum([COUPON_STATUS.ACTIVE, COUPON_STATUS.INACTIVE]).optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createCouponSchema.shape.body.partial(),
});

export const couponIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export { validate };
export default { validate, createCouponSchema, updateCouponSchema, couponIdSchema };
