import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

const faqSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
});

const processStepSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const createServiceSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    slug: z.string().min(2, 'Slug is required'),
    short_description: z.string().optional(),
    description: z.string().optional(),
    overview: z.string().optional(),
    category: z.string().optional(),
    banner_image: z.string().optional(),
    icon: z.string().optional(),
    features: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    process_steps: z.array(processStepSchema).optional(),
    gallery: z.array(z.string()).optional(),
    faqs: z.array(faqSchema).optional(),
    related_services: z.array(z.string()).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    sort_order: z.number().optional(),
    is_featured: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid service id is required') }),
  body: createServiceSchema.shape.body.partial(),
});

export const serviceIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid service id is required') }),
});

export const serviceSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1, 'Slug is required') }),
});

export default { validate, createServiceSchema, updateServiceSchema, serviceIdSchema, serviceSlugSchema };
