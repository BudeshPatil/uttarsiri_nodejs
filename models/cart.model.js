import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const cartItemSchema = new mongoose.Schema(
  {
    variant_id: { type: String, required: true },
    product_id: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    added_at: { type: String },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    cart_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    coupon_code: { type: String, default: null },
    updated_at: { type: String },
    created_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'carts',
  },
);

cartSchema.index({ user_id: 1 });

export const buildCart = (data) => {
  const now = new Date().toISOString();
  return {
    cart_id: data.cart_id || generateId(),
    user_id: data.user_id,
    items: data.items || [],
    coupon_code: data.coupon_code || null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

export default Cart;
