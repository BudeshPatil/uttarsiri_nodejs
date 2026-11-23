import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const testimonialSchema = new mongoose.Schema(
  {
    testimonial_id: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true },
    customer_image: { type: String, default: '' },
    customer_location: { type: String, default: '' },
    service_id: { type: String, default: '' },
    service_name: { type: String, default: '' },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    content: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    is_featured: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'testimonials',
  },
);

testimonialSchema.index({ status: 1 });
testimonialSchema.index({ rating: 1 });
testimonialSchema.index({ is_featured: 1 });
testimonialSchema.index({ is_deleted: 1 });
testimonialSchema.index({ created_at: -1 });

export const buildTestimonial = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    testimonial_id: data.testimonial_id || generateId(),
    customer_name: data.customer_name,
    customer_image: data.customer_image || '',
    customer_location: data.customer_location || '',
    service_id: data.service_id || '',
    service_name: data.service_name || '',
    rating: data.rating ?? 5,
    content: data.content || '',
    status: data.status || 'pending',
    is_featured: data.is_featured ?? false,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
