import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const roleSchema = new mongoose.Schema(
  {
    role_id: { type: String, required: true, unique: true },
    role_name: { type: String, required: true },
    role_code: { type: String, required: true },
    description: { type: String, default: '' },
    permissions: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    created_at: { type: String },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'roles',
  },
);

roleSchema.index({ role_code: 1 }, { unique: true });
roleSchema.index({ created_at: -1 });
roleSchema.index({ updated_at: -1 });

export const buildRole = (data) => {
  const now = new Date().toISOString();
  return {
    role_id: data.role_id || generateId(),
    role_name: data.role_name,
    role_code: data.role_code?.toUpperCase(),
    description: data.description || '',
    permissions: data.permissions || [],
    is_active: data.is_active ?? true,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

export default Role;
