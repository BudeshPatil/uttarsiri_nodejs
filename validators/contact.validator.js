import { z } from 'zod';
import { validate } from './auth.validator.js';

export { validate };

export const createContactSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    message: z.string().optional(),
    service_interest: z.string().optional(),
    source: z.string().optional(),
  }),
});

const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export const updateContactSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contact id is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    message: z.string().optional(),
    service_interest: z.string().optional(),
    source: z.string().optional(),
    lead_status: z.enum(['new', 'contacted', 'follow_up', 'quotation_sent', 'converted', 'closed']).optional(),
    status: z.enum(['new', 'read', 'resolved']).optional(),
    assigned_to: z.string().optional(),
    assigned_to_name: z.string().optional(),
    follow_up_date: z.string().optional(),
    note: noteSchema.optional(),
  }),
});

export const contactIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contact id is required'),
  }),
});

export default { validate, createContactSchema, updateContactSchema, contactIdSchema };
