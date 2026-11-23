import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { DEFAULT_COMMISSION_RATE, VENDOR_STATUS } from '../constants/vendor.constants.js';

const bankDetailsSchema = new mongoose.Schema(
  {
    account_holder_name: { type: String, default: '' },
    account_number: { type: String, default: '' },
    ifsc_code: { type: String, default: '' },
    bank_name: { type: String, default: '' },
    branch: { type: String, default: '' },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  { _id: false },
);

const vendorSchema = new mongoose.Schema(
  {
    vendor_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, unique: true },
    business_name: { type: String, required: true },
    owner_name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: addressSchema, default: () => ({}) },
    gstin: { type: String, default: '' },
    business_documents: { type: [String], default: [] },
    bank_details: { type: bankDetailsSchema, default: () => ({}) },
    status: { type: String, default: VENDOR_STATUS.PENDING },
    preferred_language: { type: String, default: 'en' },
    commission_rate: { type: Number, default: DEFAULT_COMMISSION_RATE },
    rejection_reason: { type: String, default: null },
    suspended_reason: { type: String, default: null },
    approved_at: { type: String, default: null },
    approved_by: { type: String, default: null },
    created_at: { type: String },
    updated_at: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'vendors',
  },
);

vendorSchema.index({ status: 1, is_deleted: 1 });
vendorSchema.index({ business_name: 1 });
vendorSchema.index({ email: 1 });

export const buildVendor = (data) => {
  const now = new Date().toISOString();
  return {
    vendor_id: data.vendor_id || generateId(),
    user_id: data.user_id,
    business_name: String(data.business_name || '').trim(),
    owner_name: String(data.owner_name || '').trim(),
    mobile: String(data.mobile || '').trim(),
    email: String(data.email || '').trim().toLowerCase(),
    address: {
      line1: String(data.address?.line1 || '').trim(),
      line2: String(data.address?.line2 || '').trim(),
      city: String(data.address?.city || '').trim(),
      state: String(data.address?.state || '').trim(),
      pincode: String(data.address?.pincode || '').trim(),
    },
    gstin: String(data.gstin || '').trim().toUpperCase(),
    business_documents: Array.isArray(data.business_documents)
      ? data.business_documents.map((doc) => String(doc).trim()).filter(Boolean)
      : [],
    bank_details: {
      account_holder_name: String(data.bank_details?.account_holder_name || '').trim(),
      account_number: String(data.bank_details?.account_number || '').trim(),
      ifsc_code: String(data.bank_details?.ifsc_code || '').trim().toUpperCase(),
      bank_name: String(data.bank_details?.bank_name || '').trim(),
      branch: String(data.bank_details?.branch || '').trim(),
    },
    status: data.status || VENDOR_STATUS.PENDING,
    preferred_language: ['en', 'kn', 'hi'].includes(data.preferred_language)
      ? data.preferred_language
      : 'en',
    commission_rate:
      data.commission_rate === undefined || data.commission_rate === null
        ? DEFAULT_COMMISSION_RATE
        : Number(data.commission_rate),
    rejection_reason: data.rejection_reason || null,
    suspended_reason: data.suspended_reason || null,
    approved_at: data.approved_at || null,
    approved_by: data.approved_by || null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    is_deleted: data.is_deleted ?? false,
  };
};

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

export default Vendor;
