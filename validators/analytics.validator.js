import { z } from 'zod';
import { validate } from './auth.validator.js';
import { ANALYTICS_SECTIONS, TREND_GRANULARITY } from '../constants/analytics.constants.js';

const emptyToUndefined = (value) => (value === '' || value === null || value === undefined ? undefined : value);

const dateString = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Expected YYYY-MM-DD date').optional(),
);

const optionalUuid = z.preprocess(emptyToUndefined, z.string().uuid().optional());

export const analyticsQuerySchema = z.object({
  query: z.object({
    from: dateString,
    to: dateString,
    category_id: optionalUuid,
    vendor_id: optionalUuid,
    customer_id: optionalUuid,
    granularity: z.preprocess(
      emptyToUndefined,
      z.enum([TREND_GRANULARITY.DAY, TREND_GRANULARITY.WEEK, TREND_GRANULARITY.MONTH]).optional(),
    ),
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    limit: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().max(100).optional()),
    section: z.preprocess(emptyToUndefined, z.enum(ANALYTICS_SECTIONS).optional()),
    format: z.preprocess(emptyToUndefined, z.enum(['json', 'csv', 'xlsx']).optional()),
  }),
});

export { validate };
export default { validate, analyticsQuerySchema };
