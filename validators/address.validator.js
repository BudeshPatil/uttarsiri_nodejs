import { z } from 'zod';
import { validate } from './auth.validator.js';

const addressBody = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(10),
  house_number: z.string().min(1),
  street: z.string().min(1),
  area: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4).max(10),
  delivery_instructions: z.string().max(500).optional(),
  is_default: z.boolean().optional(),
});

export const createAddressSchema = z.object({ body: addressBody });
export const updateAddressSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: addressBody.partial(),
});
export const addressIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export { validate };
export default { validate, createAddressSchema, updateAddressSchema, addressIdSchema };
