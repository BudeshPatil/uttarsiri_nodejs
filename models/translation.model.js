import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const translationSchema = new mongoose.Schema(
  {
    translation_id: { type: String, required: true, unique: true },
    language: { type: String, required: true },
    namespace: { type: String, default: 'ui' },
    key: { type: String, required: true },
    value: { type: String, required: true },
    created_at: { type: String },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'translations',
  },
);

translationSchema.index({ language: 1, namespace: 1, key: 1 }, { unique: true });

export const buildTranslation = (data) => {
  const now = new Date().toISOString();
  return {
    translation_id: data.translation_id || generateId(),
    language: String(data.language).trim().toLowerCase(),
    namespace: String(data.namespace || 'ui').trim(),
    key: String(data.key).trim(),
    value: String(data.value),
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Translation = mongoose.models.Translation || mongoose.model('Translation', translationSchema);

export default Translation;
