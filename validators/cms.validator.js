import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createCmsPageSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    slug: z.string().min(2, 'Slug is required'),
    content: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
  }),
});

export const updateCmsPageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid page id is required'),
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    content: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
  }),
});

export const cmsPageIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid page id is required'),
  }),
});

export default { validate, createCmsPageSchema, updateCmsPageSchema, cmsPageIdSchema };
