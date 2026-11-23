import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const projectSchema = new mongoose.Schema(
  {
    project_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    short_description: { type: String, default: '' },
    description: { type: String, default: '' },
    overview: { type: String, default: '' },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    budget: { type: String, default: '' },
    project_status: { type: String, default: 'completed' },
    completion_date: { type: String, default: '' },
    cover_image: { type: String, default: '' },
    before_image: { type: String, default: '' },
    after_image: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    related_projects: { type: [String], default: [] },
    services_used: { type: [String], default: [] },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    status: { type: String, default: 'draft' },
    is_featured: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'projects',
  },
);

projectSchema.index({ slug: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ location: 1 });
projectSchema.index({ is_featured: 1 });
projectSchema.index({ is_deleted: 1 });
projectSchema.index({ created_at: -1 });

export const buildProject = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    project_id: data.project_id || generateId(),
    title: data.title,
    slug: data.slug?.toLowerCase(),
    short_description: data.short_description || '',
    description: data.description || '',
    overview: data.overview || '',
    category: data.category || '',
    location: data.location || '',
    budget: data.budget || '',
    project_status: data.project_status || 'completed',
    completion_date: data.completion_date || '',
    cover_image: data.cover_image || '',
    before_image: data.before_image || '',
    after_image: data.after_image || '',
    gallery: data.gallery || [],
    related_projects: data.related_projects || [],
    services_used: data.services_used || [],
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    status: data.status || 'draft',
    is_featured: data.is_featured ?? false,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;
