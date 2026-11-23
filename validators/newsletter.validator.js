import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const subscriberIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid subscriber id is required'),
  }),
});

export default { validate, subscriberIdSchema };
