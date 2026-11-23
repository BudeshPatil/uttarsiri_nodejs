import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { PAYMENT_GATEWAY, PAYMENT_TX_STATUS } from '../constants/payment.constants.js';

const auditEventSchema = new mongoose.Schema(
  {
    event_id: { type: String, default: null },
    event_type: { type: String, required: true },
    source: { type: String, default: 'system' },
    note: { type: String, default: '' },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    created_at: { type: String, required: true },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    payment_id: { type: String, required: true, unique: true },
    order_id: { type: String, required: true, index: true },
    order_number: { type: String, default: '' },
    customer_id: { type: String, required: true, index: true },
    gateway: { type: String, default: PAYMENT_GATEWAY.RAZORPAY },
    payment_method: { type: String, default: '' },
    amount: { type: Number, required: true },
    amount_paise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, default: PAYMENT_TX_STATUS.CREATED },
    razorpay_order_id: { type: String, default: null, index: true },
    razorpay_payment_id: { type: String, default: null, index: true },
    razorpay_signature: { type: String, default: null },
    refund_id: { type: String, default: null },
    refund_amount: { type: Number, default: 0 },
    failure_reason: { type: String, default: null },
    idempotency_key: { type: String, default: null },
    processed_event_ids: { type: [String], default: [] },
    audit_log: { type: [auditEventSchema], default: [] },
    created_at: { type: String },
    updated_at: { type: String },
  },
  {
    versionKey: false,
    collection: 'payments',
  },
);

paymentSchema.index({ order_id: 1, gateway: 1 });
paymentSchema.index({ customer_id: 1, created_at: -1 });
paymentSchema.index(
  { customer_id: 1, idempotency_key: 1 },
  { unique: true, sparse: true },
);

export const buildPayment = (data) => {
  const now = new Date().toISOString();
  return {
    payment_id: data.payment_id || generateId(),
    order_id: data.order_id,
    order_number: data.order_number || '',
    customer_id: data.customer_id,
    gateway: data.gateway || PAYMENT_GATEWAY.RAZORPAY,
    payment_method: data.payment_method || '',
    amount: Number(data.amount) || 0,
    amount_paise: Number(data.amount_paise) || 0,
    currency: data.currency || 'INR',
    status: data.status || PAYMENT_TX_STATUS.CREATED,
    razorpay_order_id: data.razorpay_order_id || null,
    razorpay_payment_id: data.razorpay_payment_id || null,
    razorpay_signature: data.razorpay_signature || null,
    refund_id: data.refund_id || null,
    refund_amount: Number(data.refund_amount) || 0,
    failure_reason: data.failure_reason || null,
    idempotency_key: data.idempotency_key || null,
    processed_event_ids: data.processed_event_ids || [],
    audit_log: data.audit_log || [],
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  };
};

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
