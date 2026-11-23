import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    slug: z.string().min(2, 'Slug is required'),
    short_description: z.string().optional(),
    description: z.string().optional(),
    overview: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    budget: z.string().optional(),
    project_status: z.enum(['completed', 'in_progress', 'on_hold', 'planning', 'ongoing', 'upcoming']).optional(),
    completion_date: z.string().optional(),
    cover_image: z.string().optional(),
    before_image: z.string().optional(),
    after_image: z.string().optional(),
    gallery: z.array(z.string()).optional(),
    related_projects: z.array(z.string()).optional(),
    services_used: z.array(z.string()).optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    is_featured: z.boolean().optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid project id is required') }),
  body: createProjectSchema.shape.body.partial(),
});

export const projectIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid project id is required') }),
});

export const projectSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1, 'Slug is required') }),
});

export default { validate, createProjectSchema, updateProjectSchema, projectIdSchema, projectSlugSchema };
