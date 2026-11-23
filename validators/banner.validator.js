import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

const optionalDate = z
  .union([z.string().datetime({ offset: true }), z.string().min(1), z.literal(''), z.null()])
  .optional();

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title is required'),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().min(1, 'Banner image is required'),
    mobile_image: z.string().optional(),
    link_url: z.string().optional(),
    link_target: z.enum(['_self', '_blank']).optional(),
    button_text: z.string().optional(),
    sort_order: z.coerce.number().int().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    starts_at: optionalDate,
    ends_at: optionalDate,
  }),
});

export const updateBannerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid banner id is required'),
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().min(1).optional(),
    mobile_image: z.string().optional(),
    link_url: z.string().optional(),
    link_target: z.enum(['_self', '_blank']).optional(),
    button_text: z.string().optional(),
    sort_order: z.coerce.number().int().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    starts_at: optionalDate,
    ends_at: optionalDate,
  }),
});

export const bannerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid banner id is required'),
  }),
});

export default { validate, createBannerSchema, updateBannerSchema, bannerIdSchema };
