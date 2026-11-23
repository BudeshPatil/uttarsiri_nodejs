import { z } from 'zod';
import { validate } from './auth.validator.js';
import { PRODUCT_UNITS } from '../constants/product.constants.js';

export { validate };

const variantBody = z
  .object({
    sku: z.string().min(2, 'Variant SKU is required'),
    weight: z.number().positive('Weight must be positive'),
    unit: z.enum(PRODUCT_UNITS),
    selling_price: z.number().nonnegative('Selling price is required'),
    original_price: z.number().nonnegative().optional(),
    stock_quantity: z.number().int().nonnegative().optional(),
    minimum_order_quantity: z.number().int().positive().optional(),
    low_stock_threshold: z.number().int().nonnegative().optional(),
    status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
  })
  .strict();

const productBody = z
  .object({
    sku: z.string().min(2, 'SKU is required'),
    product_slug: z.string().min(2).optional(),
    name_en: z.string().min(2, 'English name is required'),
    name_kn: z.string().optional(),
    name_hi: z.string().optional(),
    description_en: z.string().optional(),
    description_kn: z.string().optional(),
    description_hi: z.string().optional(),
    category_ids: z.array(z.string().uuid()).optional(),
    brand: z.string().optional(),
    product_images: z.array(z.string()).optional(),
    origin: z.string().optional(),
    ingredients: z.string().optional(),
    storage_instructions: z.string().optional(),
    shelf_life: z.string().optional(),
    search_aliases: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    is_featured: z.boolean().optional(),
    is_best_seller: z.boolean().optional(),
    variants: z.array(variantBody).optional(),
  })
  .strict();

export const createProductSchema = z.object({
  body: productBody,
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid product id is required') }),
  body: productBody.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  }),
});

export const productIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid product id is required') }),
});

export const createVariantSchema = z.object({
  params: z.object({ id: z.string().uuid('Valid product id is required') }),
  body: variantBody,
});

export const updateVariantSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid product id is required'),
    variantId: z.string().uuid('Valid variant id is required'),
  }),
  body: variantBody.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  }),
});

export const variantIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid product id is required'),
    variantId: z.string().uuid('Valid variant id is required'),
  }),
});

export const searchProductsSchema = z.object({
  query: z.object({
    q: z.string().min(1).optional(),
    search: z.string().min(1).optional(),
    lang: z.enum(['en', 'kn', 'hi']).optional(),
    language: z.enum(['en', 'kn', 'hi']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    admin: z.string().optional(),
  }),
});

export default {
  validate,
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  createVariantSchema,
  updateVariantSchema,
  variantIdSchema,
  searchProductsSchema,
};
