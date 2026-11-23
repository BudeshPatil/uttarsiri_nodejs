import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import {
  DELIVERY_OPTIONS,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from '../constants/order.constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    order_item_id: { type: String, required: true },
    product_id: { type: String, required: true },
    variant_id: { type: String, required: true },
    product_name: { type: String, required: true },
    product_name_en: { type: String, default: '' },
    product_name_kn: { type: String, default: '' },
    product_name_hi: { type: String, default: '' },
    sku: { type: String, default: '' },
    unit_label: { type: String, default: '' },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    line_total: { type: Number, required: true },
    vendor_id: { type: String, default: null },
    vendor_status: { type: String, default: 'pending' },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, unique: true },
    order_number: { type: String, required: true, unique: true },
    customer_id: { type: String, required: true, index: true },
    customer_name: { type: String, default: '' },
    customer_email: { type: String, default: '' },
    customer_phone: { type: String, default: '' },
    customer_language: { type: String, default: 'en' },
    items: { type: [orderItemSchema], default: [] },
    address_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    delivery_option: { type: String, default: DELIVERY_OPTIONS.STANDARD },
    payment_method: { type: String, default: PAYMENT_METHODS.COD },
    payment_status: { type: String, default: PAYMENT_STATUS.PENDING },
    order_status: { type: String, default: ORDER_STATUS.PLACED },
    coupon_code: { type: String, default: null },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    delivery_charges: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    idempotency_key: { type: String, default: null },
    cancellation_reason: { type: String, default: null },
    cancelled_at: { type: String, default: null },
    created_at: { type: String },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'orders',
  },
);

orderSchema.index({ customer_id: 1, created_at: -1 });
orderSchema.index({ order_status: 1, created_at: -1 });
orderSchema.index({ 'items.vendor_id': 1, created_at: -1 });
orderSchema.index({ customer_id: 1, idempotency_key: 1 }, { unique: true, sparse: true });

export const buildOrder = (data) => {
  const now = new Date().toISOString();
  return {
    order_id: data.order_id || generateId(),
    order_number: data.order_number,
    customer_id: data.customer_id,
    customer_name: data.customer_name || '',
    customer_email: data.customer_email || '',
    customer_phone: data.customer_phone || '',
    customer_language: data.customer_language || 'en',
    items: data.items || [],
    address_snapshot: data.address_snapshot,
    delivery_option: data.delivery_option || DELIVERY_OPTIONS.STANDARD,
    payment_method: data.payment_method || PAYMENT_METHODS.COD,
    payment_status: data.payment_status || PAYMENT_STATUS.PENDING,
    order_status: data.order_status || ORDER_STATUS.PLACED,
    coupon_code: data.coupon_code || null,
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    delivery_charges: Number(data.delivery_charges) || 0,
    tax: Number(data.tax) || 0,
    total: Number(data.total) || 0,
    idempotency_key: data.idempotency_key || null,
    cancellation_reason: data.cancellation_reason || null,
    cancelled_at: data.cancelled_at || null,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
