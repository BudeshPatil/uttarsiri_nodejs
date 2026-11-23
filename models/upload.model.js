import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const uploadSchema = new mongoose.Schema(
  {
    upload_id: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    url: { type: String, required: true },
    path: { type: String, required: true },
    uploaded_by: { type: String, default: null },
    created_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'uploads',
  },
);

uploadSchema.index({ uploaded_by: 1 });
uploadSchema.index({ created_at: -1 });

export const buildUpload = (data, uploadedBy = null) => {
  const now = new Date().toISOString();
  return {
    upload_id: data.upload_id || generateId(),
    filename: data.filename,
    original_name: data.original_name,
    mime_type: data.mime_type || '',
    size: data.size || 0,
    url: data.url,
    path: data.path,
    uploaded_by: uploadedBy || data.uploaded_by || null,
    created_at: data.created_at || now,
  };
};

const Upload = mongoose.models.Upload || mongoose.model('Upload', uploadSchema);

export default Upload;
