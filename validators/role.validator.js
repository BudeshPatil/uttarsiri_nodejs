import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createRoleSchema = z.object({
  body: z.object({
    role_name: z.string().min(2, 'Role name is required'),
    role_code: z.string().min(2, 'Role code is required'),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid role id is required'),
  }),
  body: z.object({
    role_name: z.string().min(2).optional(),
    role_code: z.string().min(2).optional(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const roleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid role id is required'),
  }),
});

export default { validate, createRoleSchema, updateRoleSchema, roleIdSchema };
