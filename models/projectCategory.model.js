import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { PROJECT_CATEGORY_STATUS } from '../constants/projectCategory.constants.js';

/**
 * Projects reference their category by `name`, not by id — that is what the
 * existing project documents already store and what the website filters on.
 * Renaming a category therefore has to re-point the projects using it; the
 * service layer handles that.
 */
const projectCategorySchema = new mongoose.Schema(
  {
    category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    sort_order: { type: Number, default: 0 },
    status: { type: String, default: PROJECT_CATEGORY_STATUS.ACTIVE },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'project_categories',
  },
);

projectCategorySchema.index({ name: 1 });
projectCategorySchema.index({ slug: 1 });
projectCategorySchema.index({ status: 1 });
projectCategorySchema.index({ is_deleted: 1 });
projectCategorySchema.index({ sort_order: 1 });

export const slugifyCategory = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildProjectCategory = (data, createdBy = null) => {
  const now = new Date().toISOString();
  const name = String(data.name || '').trim();

  return {
    category_id: data.category_id || generateId(),
    name,
    slug: data.slug || slugifyCategory(name),
    description: data.description || '',
    image: data.image || '',
    sort_order: Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
    status: data.status || PROJECT_CATEGORY_STATUS.ACTIVE,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const ProjectCategory =
  mongoose.models.ProjectCategory || mongoose.model('ProjectCategory', projectCategorySchema);

export default ProjectCategory;
