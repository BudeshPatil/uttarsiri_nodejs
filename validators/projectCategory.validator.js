import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createProjectCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name is required'),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    sort_order: z.number().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const updateProjectCategorySchema = z.object({
  params: z.object({ id: z.string().uuid('Valid category id is required') }),
  body: createProjectCategorySchema.shape.body.partial(),
});

export const projectCategoryIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid category id is required') }),
});

export default {
  validate, createProjectCategorySchema, updateProjectCategorySchema, projectCategoryIdSchema,
};
