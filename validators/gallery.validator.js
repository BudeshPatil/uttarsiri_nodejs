import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createGallerySchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    image: z.string().min(1, 'Image is required'),
    alt_text: z.string().optional(),
    caption: z.string().optional(),
    section: z.string().optional(),
    sort_order: z.number().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    is_featured: z.boolean().optional(),
  }),
});

export const updateGallerySchema = z.object({
  params: z.object({ id: z.string().uuid('Valid gallery id is required') }),
  body: createGallerySchema.shape.body.partial(),
});

export const galleryIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid gallery id is required') }),
});

export default { validate, createGallerySchema, updateGallerySchema, galleryIdSchema };
