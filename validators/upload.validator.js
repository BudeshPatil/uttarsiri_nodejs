import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const uploadIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid upload id is required'),
  }),
});

export default { validate, uploadIdSchema };
