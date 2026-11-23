import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
  },
  { _id: false },
);

const processStepSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
  { _id: false },
);

const serviceSchema = new mongoose.Schema(
  {
    service_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    short_description: { type: String, default: '' },
    description: { type: String, default: '' },
    overview: { type: String, default: '' },
    category: { type: String, default: '' },
    banner_image: { type: String, default: '' },
    icon: { type: String, default: '' },
    features: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    process_steps: { type: [processStepSchema], default: [] },
    gallery: { type: [String], default: [] },
    faqs: { type: [faqSchema], default: [] },
    related_services: { type: [String], default: [] },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    status: { type: String, default: 'draft' },
    sort_order: { type: Number, default: 0 },
    is_featured: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'services',
  },
);

serviceSchema.index({ slug: 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ is_featured: 1 });
serviceSchema.index({ is_deleted: 1 });
serviceSchema.index({ sort_order: 1 });
serviceSchema.index({ created_at: -1 });

export const buildService = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    service_id: data.service_id || generateId(),
    title: data.title,
    slug: data.slug?.toLowerCase(),
    short_description: data.short_description || '',
    description: data.description || '',
    overview: data.overview || '',
    category: data.category || '',
    banner_image: data.banner_image || '',
    icon: data.icon || '',
    features: data.features || [],
    benefits: data.benefits || [],
    process_steps: data.process_steps || [],
    gallery: data.gallery || [],
    faqs: data.faqs || [],
    related_services: data.related_services || [],
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    status: data.status || 'draft',
    sort_order: data.sort_order ?? 0,
    is_featured: data.is_featured ?? false,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;
