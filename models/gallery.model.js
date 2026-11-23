import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { GALLERY_SECTIONS, GALLERY_STATUS } from '../constants/gallery.constants.js';

const gallerySchema = new mongoose.Schema(
  {
    gallery_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    alt_text: { type: String, default: '' },
    caption: { type: String, default: '' },
    section: { type: String, default: GALLERY_SECTIONS.ABOUT },
    sort_order: { type: Number, default: 0 },
    status: { type: String, default: GALLERY_STATUS.ACTIVE },
    is_featured: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'galleries',
  },
);

gallerySchema.index({ section: 1 });
gallerySchema.index({ status: 1 });
gallerySchema.index({ is_featured: 1 });
gallerySchema.index({ is_deleted: 1 });
gallerySchema.index({ sort_order: 1 });
gallerySchema.index({ created_at: -1 });

export const buildGallery = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    gallery_id: data.gallery_id || generateId(),
    title: data.title,
    image: data.image,
    alt_text: data.alt_text || '',
    caption: data.caption || '',
    section: data.section || GALLERY_SECTIONS.ABOUT,
    sort_order: Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
    status: data.status || GALLERY_STATUS.ACTIVE,
    is_featured: data.is_featured ?? false,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);

export default Gallery;
