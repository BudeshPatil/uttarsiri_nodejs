import BaseRepository from './base.repository.js';
import Payment, { buildPayment } from '../models/payment.model.js';

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async createPayment(data, session = null) {
    const payment = buildPayment(data);
    if (session) {
      await this.model.create([payment], { session });
    } else {
      await this.createItem(payment);
    }
    return payment;
  }

  async getById(paymentId) {
    return this.getItem({ payment_id: paymentId });
  }

  async getByOrderId(orderId) {
    return this.getItem({ order_id: orderId });
  }

  async getByRazorpayOrderId(razorpayOrderId) {
    if (!razorpayOrderId) return null;
    return this.getItem({ razorpay_order_id: razorpayOrderId });
  }

  async getByRazorpayPaymentId(razorpayPaymentId) {
    if (!razorpayPaymentId) return null;
    return this.getItem({ razorpay_payment_id: razorpayPaymentId });
  }

  async getByIdempotencyKey(customerId, idempotencyKey) {
    if (!idempotencyKey) return null;
    return this.getItem({ customer_id: customerId, idempotency_key: idempotencyKey });
  }

  async updatePayment(paymentId, updates, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    const doc = await this.model.findOneAndUpdate(
      { payment_id: paymentId },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      options,
    );
    return this.toPlain(doc);
  }

  async appendAuditEvent(paymentId, event, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    const doc = await this.model.findOneAndUpdate(
      { payment_id: paymentId },
      {
        $push: { audit_log: event },
        $set: { updated_at: new Date().toISOString() },
      },
      options,
    );
    return this.toPlain(doc);
  }

  async markEventProcessed(paymentId, eventId, updates = {}, session = null) {
    if (!eventId) {
      return this.updatePayment(paymentId, updates, session);
    }
    const options = { new: true };
    if (session) options.session = session;
    const doc = await this.model.findOneAndUpdate(
      {
        payment_id: paymentId,
        processed_event_ids: { $ne: eventId },
      },
      {
        $addToSet: { processed_event_ids: eventId },
        $set: { ...updates, updated_at: new Date().toISOString() },
      },
      options,
    );
    return this.toPlain(doc);
  }
}

export default new PaymentRepository();
