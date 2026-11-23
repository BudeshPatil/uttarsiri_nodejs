import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const permissionSchema = new mongoose.Schema(
  {
    permission_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    module: { type: String, required: true },
    description: { type: String, default: '' },
    created_at: { type: String },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'permissions',
  },
);

permissionSchema.index({ code: 1 }, { unique: true });
permissionSchema.index({ module: 1 });
permissionSchema.index({ created_at: -1 });
permissionSchema.index({ updated_at: -1 });

export const buildPermission = (data) => {
  const now = new Date().toISOString();
  return {
    permission_id: data.permission_id || generateId(),
    name: data.name,
    code: data.code?.toUpperCase(),
    module: data.module,
    description: data.description || '',
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);

export default Permission;
