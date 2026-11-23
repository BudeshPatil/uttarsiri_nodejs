import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { slugify } from '../utils/slug.util.js';
import { CATEGORY_STATUS } from '../constants/category.constants.js';

const categorySchema = new mongoose.Schema(
  {
    category_id: { type: String, required: true, unique: true },
    parent_category_id: { type: String, default: null, index: true },
    category_slug: { type: String, required: true },
    name_en: { type: String, required: true },
    name_kn: { type: String, default: '' },
    name_hi: { type: String, default: '' },
    description_en: { type: String, default: '' },
    description_kn: { type: String, default: '' },
    description_hi: { type: String, default: '' },
    image: { type: String, default: '' },
    display_order: { type: Number, default: 0 },
    status: { type: String, default: CATEGORY_STATUS.ACTIVE },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'categories',
  },
);

categorySchema.index({ category_slug: 1 }, { unique: true });
categorySchema.index({ status: 1, is_deleted: 1, display_order: 1 });
categorySchema.index({ name_en: 'text', name_kn: 'text', name_hi: 'text' });

export const buildCategory = (data, createdBy = null) => {
  const now = new Date().toISOString();
  const nameEn = String(data.name_en || '').trim();

  return {
    category_id: data.category_id || generateId(),
    parent_category_id: data.parent_category_id || null,
    category_slug: data.category_slug ? slugify(data.category_slug) : slugify(nameEn),
    name_en: nameEn,
    name_kn: String(data.name_kn || '').trim(),
    name_hi: String(data.name_hi || '').trim(),
    description_en: String(data.description_en || '').trim(),
    description_kn: String(data.description_kn || '').trim(),
    description_hi: String(data.description_hi || '').trim(),
    image: String(data.image || '').trim(),
    display_order: Number.isFinite(Number(data.display_order)) ? Number(data.display_order) : 0,
    status: data.status || CATEGORY_STATUS.ACTIVE,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
