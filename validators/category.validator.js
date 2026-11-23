import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

const categoryBody = z
  .object({
    parent_category_id: z.string().uuid().nullable().optional(),
    category_slug: z.string().min(2).optional(),
    name_en: z.string().min(2, 'English name is required'),
    name_kn: z.string().optional(),
    name_hi: z.string().optional(),
    description_en: z.string().optional(),
    description_kn: z.string().optional(),
    description_hi: z.string().optional(),
    image: z.string().optional(),
    display_order: z.number().int().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .strict();

export const createCategorySchema = z.object({
  body: categoryBody,
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().uuid('Valid category id is required') }),
  body: categoryBody.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid category id is required') }),
});

export default {
  validate,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
};
