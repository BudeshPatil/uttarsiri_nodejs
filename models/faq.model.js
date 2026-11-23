import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { FAQ_STATUS } from '../constants/faq.constants.js';

/**
 * Site-wide FAQs shown in the "Frequently Asked Questions" section.
 * Per-service FAQs stay embedded on the service document — this is the general
 * list, not a replacement for those.
 */
const faqSchema = new mongoose.Schema(
  {
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    sort_order: { type: Number, default: 0 },
    status: { type: String, default: FAQ_STATUS.ACTIVE },
    is_featured: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'faqs',
  },
);

faqSchema.index({ status: 1 });
faqSchema.index({ is_featured: 1 });
faqSchema.index({ is_deleted: 1 });
faqSchema.index({ sort_order: 1 });
faqSchema.index({ created_at: -1 });

export const buildFaq = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    faq_id: data.faq_id || generateId(),
    question: String(data.question || '').trim(),
    answer: String(data.answer || '').trim(),
    sort_order: Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
    status: data.status || FAQ_STATUS.ACTIVE,
    is_featured: data.is_featured ?? false,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Faq = mongoose.models.Faq || mongoose.model('Faq', faqSchema);

export default Faq;
