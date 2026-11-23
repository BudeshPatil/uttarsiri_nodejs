import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { COUPON_STATUS, COUPON_TYPES } from '../constants/coupon.constants.js';

const couponSchema = new mongoose.Schema(
  {
    coupon_id: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    description: { type: String, default: '' },
    discount_type: { type: String, required: true },
    discount_value: { type: Number, required: true },
    minimum_order_amount: { type: Number, default: 0 },
    max_discount_amount: { type: Number, default: null },
    usage_limit: { type: Number, default: null },
    used_count: { type: Number, default: 0 },
    per_user_limit: { type: Number, default: 1 },
    starts_at: { type: String, default: null },
    expires_at: { type: String, default: null },
    status: { type: String, default: COUPON_STATUS.ACTIVE },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'coupons',
  },
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ status: 1, is_deleted: 1 });

export const buildCoupon = (data, createdBy = null) => {
  const now = new Date().toISOString();
  return {
    coupon_id: data.coupon_id || generateId(),
    code: String(data.code || '')
      .trim()
      .toUpperCase(),
    description: String(data.description || '').trim(),
    discount_type: data.discount_type || COUPON_TYPES.PERCENTAGE,
    discount_value: Number(data.discount_value) || 0,
    minimum_order_amount: Number(data.minimum_order_amount) || 0,
    max_discount_amount:
      data.max_discount_amount === null || data.max_discount_amount === undefined
        ? null
        : Number(data.max_discount_amount),
    usage_limit:
      data.usage_limit === null || data.usage_limit === undefined ? null : Number(data.usage_limit),
    used_count: Number(data.used_count) || 0,
    per_user_limit: Math.max(1, Number(data.per_user_limit) || 1),
    starts_at: data.starts_at || null,
    expires_at: data.expires_at || null,
    status: data.status || COUPON_STATUS.ACTIVE,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
