import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { USER_STATUS } from '../constants/user.constants.js';

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role_id: { type: String, default: null },
    status: { type: String, default: USER_STATUS.PENDING },
    profile_image: { type: String, default: null },
    preferred_language: { type: String, default: 'en' },
    last_login: { type: String, default: null },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
    refresh_token: { type: String, default: null },
    reset_token: { type: String, default: null },
    reset_token_expiry: { type: String, default: null },
  },
  {
    versionKey: false,
    collection: 'users',
  },
);

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role_id: 1 });
userSchema.index({ status: 1 });
userSchema.index({ is_deleted: 1 });
userSchema.index({ created_at: -1 });
userSchema.index({ updated_at: -1 });

export const buildUser = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    user_id: data.user_id || generateId(),
    name: data.name,
    email: data.email?.toLowerCase(),
    phone: data.phone,
    password: data.password,
    role_id: data.role_id,
    status: data.status || USER_STATUS.PENDING,
    profile_image: data.profile_image || null,
    preferred_language: ['en', 'kn', 'hi'].includes(data.preferred_language)
      ? data.preferred_language
      : 'en',
    last_login: data.last_login || null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
    refresh_token: data.refresh_token || null,
    reset_token: data.reset_token || null,
    reset_token_expiry: data.reset_token_expiry || null,
  };
};

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, refresh_token, reset_token, reset_token_expiry, ...safeUser } = user;
  return safeUser;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
