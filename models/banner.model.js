import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { BANNER_STATUS } from '../constants/banner.constants.js';

const bannerSchema = new mongoose.Schema(
  {
    banner_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    mobile_image: { type: String, default: '' },
    link_url: { type: String, default: '' },
    link_target: { type: String, default: '_self' },
    button_text: { type: String, default: '' },
    sort_order: { type: Number, default: 0 },
    status: { type: String, default: BANNER_STATUS.ACTIVE },
    starts_at: { type: String, default: null },
    ends_at: { type: String, default: null },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'banners',
  },
);

bannerSchema.index({ status: 1 });
bannerSchema.index({ sort_order: 1 });
bannerSchema.index({ is_deleted: 1 });
bannerSchema.index({ created_at: -1 });

export const buildBanner = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    banner_id: data.banner_id || generateId(),
    title: data.title,
    subtitle: data.subtitle || '',
    description: data.description || '',
    image: data.image,
    mobile_image: data.mobile_image || '',
    link_url: data.link_url || '',
    link_target: data.link_target || '_self',
    button_text: data.button_text || '',
    sort_order: Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
    status: data.status || BANNER_STATUS.ACTIVE,
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

export default Banner;
