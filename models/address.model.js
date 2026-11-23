import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const addressSchema = new mongoose.Schema(
  {
    address_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, index: true },
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    house_number: { type: String, required: true },
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    delivery_instructions: { type: String, default: '' },
    is_default: { type: Boolean, default: false },
    created_at: { type: String },
    updated_at: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'addresses',
  },
);

addressSchema.index({ user_id: 1, is_deleted: 1 });
addressSchema.index({ user_id: 1, is_default: 1 });

export const buildAddress = (data) => {
  const now = new Date().toISOString();
  return {
    address_id: data.address_id || generateId(),
    user_id: data.user_id,
    full_name: String(data.full_name || '').trim(),
    phone: String(data.phone || '').trim(),
    house_number: String(data.house_number || '').trim(),
    street: String(data.street || '').trim(),
    area: String(data.area || '').trim(),
    city: String(data.city || '').trim(),
    state: String(data.state || '').trim(),
    pincode: String(data.pincode || '').trim(),
    delivery_instructions: String(data.delivery_instructions || '').trim(),
    is_default: Boolean(data.is_default),
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    is_deleted: data.is_deleted ?? false,
  };
};

export const snapshotAddress = (address) => {
  if (!address) return null;
  return {
    address_id: address.address_id,
    full_name: address.full_name,
    phone: address.phone,
    house_number: address.house_number,
    street: address.street,
    area: address.area,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    delivery_instructions: address.delivery_instructions || '',
  };
};

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

export default Address;
