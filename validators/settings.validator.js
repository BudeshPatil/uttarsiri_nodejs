import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const updateSettingsSchema = z.object({
  body: z.record(z.unknown()),
});

export const updateSeoSchema = z.object({
  body: z.object({
    seo: z.record(z.unknown()).optional(),
    sitemap: z.record(z.unknown()).optional(),
    robots: z.record(z.unknown()).optional(),
    google_tag_manager: z.record(z.unknown()).optional(),
    google_analytics: z.record(z.unknown()).optional(),
  }),
});

export default { validate, updateSettingsSchema, updateSeoSchema };
