import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    slug: z.string().min(2, 'Slug is required'),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    author: z.string().optional(),
    cover_image: z.string().optional(),
    related_blogs: z.array(z.string()).optional(),
  }),
});

export const updateBlogSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid blog id is required'),
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    excerpt: z.string().optional(),
    content: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    author: z.string().optional(),
    cover_image: z.string().optional(),
    related_blogs: z.array(z.string()).optional(),
  }),
});

export const blogIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid blog id is required'),
  }),
});

export default { validate, createBlogSchema, updateBlogSchema, blogIdSchema };
