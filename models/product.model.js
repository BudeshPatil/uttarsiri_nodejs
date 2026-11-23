import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { slugify } from '../utils/slug.util.js';
import { PRODUCT_STATUS } from '../constants/product.constants.js';

const productSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true, unique: true },
    sku: { type: String, required: true },
    product_slug: { type: String, required: true },
    name_en: { type: String, required: true },
    name_kn: { type: String, default: '' },
    name_hi: { type: String, default: '' },
    description_en: { type: String, default: '' },
    description_kn: { type: String, default: '' },
    description_hi: { type: String, default: '' },
    category_ids: { type: [String], default: [] },
    vendor_id: { type: String, default: null, index: true },
    brand: { type: String, default: '' },
    product_images: { type: [String], default: [] },
    origin: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    storage_instructions: { type: String, default: '' },
    shelf_life: { type: String, default: '' },
    search_aliases: { type: [String], default: [] },
    status: { type: String, default: PRODUCT_STATUS.DRAFT },
    is_featured: { type: Boolean, default: false },
    is_best_seller: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'products',
  },
);

productSchema.index({ product_slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category_ids: 1 });
productSchema.index({ status: 1, is_deleted: 1 });
productSchema.index({ is_featured: 1 });
productSchema.index({ is_best_seller: 1 });
productSchema.index({
  name_en: 'text',
  name_kn: 'text',
  name_hi: 'text',
  search_aliases: 'text',
  brand: 'text',
});

export const buildProduct = (data, createdBy = null) => {
  const now = new Date().toISOString();
  const nameEn = String(data.name_en || '').trim();
  const aliases = Array.isArray(data.search_aliases)
    ? data.search_aliases.map((a) => String(a).trim()).filter(Boolean)
    : [];

  return {
    product_id: data.product_id || generateId(),
    sku: String(data.sku || '').trim().toUpperCase(),
    product_slug: data.product_slug ? slugify(data.product_slug) : slugify(nameEn),
    name_en: nameEn,
    name_kn: String(data.name_kn || '').trim(),
    name_hi: String(data.name_hi || '').trim(),
    description_en: String(data.description_en || '').trim(),
    description_kn: String(data.description_kn || '').trim(),
    description_hi: String(data.description_hi || '').trim(),
    category_ids: Array.isArray(data.category_ids)
      ? [...new Set(data.category_ids.map((id) => String(id).trim()).filter(Boolean))]
      : [],
    vendor_id: data.vendor_id || null,
    brand: String(data.brand || '').trim(),
    product_images: Array.isArray(data.product_images)
      ? data.product_images.map((img) => String(img).trim()).filter(Boolean)
      : [],
    origin: String(data.origin || '').trim(),
    ingredients: String(data.ingredients || '').trim(),
    storage_instructions: String(data.storage_instructions || '').trim(),
    shelf_life: String(data.shelf_life || '').trim(),
    search_aliases: aliases,
    status: data.status || PRODUCT_STATUS.DRAFT,
    is_featured: data.is_featured ?? false,
    is_best_seller: data.is_best_seller ?? false,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
