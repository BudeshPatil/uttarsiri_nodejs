import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const cmsPageSchema = new mongoose.Schema(
  {
    page_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, default: '' },
    status: { type: String, default: 'draft' },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'cms_pages',
  },
);

cmsPageSchema.index({ slug: 1 });
cmsPageSchema.index({ status: 1 });
cmsPageSchema.index({ is_deleted: 1 });
cmsPageSchema.index({ created_at: -1 });
cmsPageSchema.index({ updated_at: -1 });

export const buildCmsPage = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    page_id: data.page_id || generateId(),
    title: data.title,
    slug: data.slug?.toLowerCase(),
    content: data.content || '',
    status: data.status || 'draft',
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const CmsPage = mongoose.models.CmsPage || mongoose.model('CmsPage', cmsPageSchema);

export default CmsPage;
