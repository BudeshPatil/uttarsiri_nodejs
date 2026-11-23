import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createFaqSchema = z.object({
  body: z.object({
    question: z.string().min(5, 'Question is required'),
    answer: z.string().min(2, 'Answer is required'),
    sort_order: z.number().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    is_featured: z.boolean().optional(),
  }),
});

export const updateFaqSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid FAQ id is required') }),
  body: createFaqSchema.shape.body.partial(),
});

export const faqIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid FAQ id is required') }),
});

export default { validate, createFaqSchema, updateFaqSchema, faqIdSchema };
