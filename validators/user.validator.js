import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    role_id: z.string().uuid('Valid role_id is required'),
    status: z.enum(['pending', 'approved', 'rejected', 'blocked']).optional(),
    // profile_image: z.string().url().optional().nullable(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid user id is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    password: z.string().min(8).optional(),
    role_id: z.string().uuid().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'blocked']).optional(),
    profile_image: z.string().url().optional().nullable(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid user id is required'),
  }),
});

export default { validate, createUserSchema, updateUserSchema, userIdSchema };
