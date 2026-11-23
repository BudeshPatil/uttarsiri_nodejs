import { z } from 'zod';
import { validate } from './auth.validator.js';

export const addCartItemSchema = z.object({
  body: z.object({
    variant_id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).optional(),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({ variantId: z.string().uuid() }),
  body: z.object({
    quantity: z.coerce.number().int().min(1),
  }),
});

export const cartVariantIdSchema = z.object({
  params: z.object({ variantId: z.string().uuid() }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(40),
  }),
});

export const mergeCartSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          variant_id: z.string().uuid(),
          quantity: z.coerce.number().int().min(1),
        }),
      )
      .default([]),
  }),
});

export { validate };
export default {
  validate,
  addCartItemSchema,
  updateCartItemSchema,
  cartVariantIdSchema,
  applyCouponSchema,
  mergeCartSchema,
};
