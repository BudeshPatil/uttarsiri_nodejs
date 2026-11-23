import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createTestimonialSchema = z.object({
  body: z.object({
    customer_name: z.string().min(2, 'Customer name is required'),
    customer_image: z.string().optional(),
    customer_location: z.string().optional(),
    service_id: z.string().optional(),
    service_name: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    content: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    is_featured: z.boolean().optional(),
  }),
});

export const updateTestimonialSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid testimonial id is required') }),
  body: createTestimonialSchema.shape.body.partial(),
});

export const testimonialIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid testimonial id is required') }),
});

export default { validate, createTestimonialSchema, updateTestimonialSchema, testimonialIdSchema };
