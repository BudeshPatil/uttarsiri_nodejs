import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createPermissionSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().min(2, 'Code is required'),
    module: z.string().min(2, 'Module is required'),
    description: z.string().optional(),
  }),
});

export const updatePermissionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid permission id is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
    module: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const permissionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid permission id is required'),
  }),
});

export default { validate, createPermissionSchema, updatePermissionSchema, permissionIdSchema };
