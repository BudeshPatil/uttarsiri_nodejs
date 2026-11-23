import { z } from 'zod';
import { validate } from './auth.validator.js';
import { VENDOR_ORDER_ITEM_STATUS } from '../constants/vendor.constants.js';

const addressSchema = z
  .object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(4).max(10),
  })
  .optional();

const bankSchema = z
  .object({
    account_holder_name: z.string().optional(),
    account_number: z.string().optional(),
    ifsc_code: z.string().optional(),
    bank_name: z.string().optional(),
    branch: z.string().optional(),
  })
  .optional();

export const vendorRegisterSchema = z.object({
  body: z.object({
    business_name: z.string().min(2),
    owner_name: z.string().min(2),
    mobile: z.string().min(10),
    email: z.string().email(),
    password: z.string().min(8),
    address: addressSchema,
    gstin: z.string().max(20).optional(),
    business_documents: z.array(z.string()).optional(),
    bank_details: bankSchema,
    preferred_language: z.enum(['en', 'kn', 'hi']).optional(),
  }),
});

export const updateVendorSchema = z.object({
  body: z.object({
    business_name: z.string().min(2).optional(),
    owner_name: z.string().min(2).optional(),
    mobile: z.string().min(10).optional(),
    address: addressSchema,
    gstin: z.string().max(20).optional(),
    business_documents: z.array(z.string()).optional(),
    bank_details: bankSchema,
    preferred_language: z.enum(['en', 'kn', 'hi']).optional(),
  }),
});

export const vendorIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const rejectSuspendSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reason: z.string().max(500).optional() }),
});

export const vendorOrderStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    order_item_id: z.string().uuid(),
    status: z.enum([
      VENDOR_ORDER_ITEM_STATUS.ACCEPTED,
      VENDOR_ORDER_ITEM_STATUS.REJECTED,
      VENDOR_ORDER_ITEM_STATUS.PREPARING,
      VENDOR_ORDER_ITEM_STATUS.READY,
      VENDOR_ORDER_ITEM_STATUS.DISPATCHED,
    ]),
    reason: z.string().max(300).optional(),
  }),
});

export const vendorProductIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export { validate };
export default {
  validate,
  vendorRegisterSchema,
  updateVendorSchema,
  vendorIdSchema,
  rejectSuspendSchema,
  vendorOrderStatusSchema,
  vendorProductIdSchema,
};
