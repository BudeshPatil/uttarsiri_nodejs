import { z } from 'zod';
import { validate } from './auth.validator.js';
import { STOCK_MOVEMENT_TYPES } from '../constants/inventory.constants.js';

export { validate };

export const updateInventorySchema = z.object({
  params: z.object({
    variantId: z.string().uuid('Valid variant id is required'),
  }),
  body: z
    .object({
      available_stock: z.number().int().nonnegative().optional(),
      reserved_stock: z.number().int().nonnegative().optional(),
      low_stock_threshold: z.number().int().nonnegative().optional(),
      adjustment: z.number().int().optional(),
      reserve: z.number().int().positive().optional(),
      release: z.number().int().positive().optional(),
      movement_type: z.enum(Object.values(STOCK_MOVEMENT_TYPES)).optional(),
      reason: z.string().optional(),
      reference_id: z.string().nullable().optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.available_stock !== undefined ||
        data.reserved_stock !== undefined ||
        data.low_stock_threshold !== undefined ||
        data.adjustment !== undefined ||
        data.reserve !== undefined ||
        data.release !== undefined,
      { message: 'Provide at least one inventory field to update' },
    ),
});

export const inventoryVariantIdSchema = z.object({
  params: z.object({
    variantId: z.string().uuid('Valid variant id is required'),
  }),
});

export default {
  validate,
  updateInventorySchema,
  inventoryVariantIdSchema,
};
