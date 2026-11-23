import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const translationLanguageSchema = z.object({
  params: z.object({
    language: z.enum(['en', 'kn', 'hi'], {
      errorMap: () => ({ message: 'Language must be en, kn, or hi' }),
    }),
  }),
  query: z
    .object({
      namespace: z.string().optional(),
      include_catalog: z.string().optional(),
    })
    .optional(),
});

export default { validate, translationLanguageSchema };
