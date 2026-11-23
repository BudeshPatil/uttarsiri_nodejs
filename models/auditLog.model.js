import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const auditLogSchema = new mongoose.Schema(
  {
    log_id: { type: String, required: true, unique: true },
    user_id: { type: String, default: null },
    action: { type: String, required: true },
    module: { type: String, required: true },
    old_data: { type: mongoose.Schema.Types.Mixed, default: null },
    new_data: { type: mongoose.Schema.Types.Mixed, default: null },
    created_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'audit_logs',
  },
);

auditLogSchema.index({ user_id: 1, created_at: -1 });
auditLogSchema.index({ module: 1, created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });
auditLogSchema.index({ created_at: -1 });

export const buildAuditLog = (data) => {
  const now = new Date().toISOString();
  return {
    log_id: data.log_id || generateId(),
    user_id: data.user_id,
    action: data.action,
    module: data.module,
    old_data: data.old_data || null,
    new_data: data.new_data || null,
    created_at: data.created_at || now,
  };
};

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
