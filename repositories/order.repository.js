import BaseRepository from './base.repository.js';
import Order, { buildOrder } from '../models/order.model.js';

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async createOrder(data, session = null) {
    const order = buildOrder(data);
    if (session) {
      await this.model.create([order], { session });
    } else {
      await this.createItem(order);
    }
    return order;
  }

  async getById(orderId) {
    return this.getItem({ order_id: orderId });
  }

  async getByOrderNumber(orderNumber) {
    return this.getItem({ order_number: orderNumber });
  }

  async getByIdempotencyKey(customerId, idempotencyKey) {
    if (!idempotencyKey) return null;
    return this.getItem({ customer_id: customerId, idempotency_key: idempotencyKey });
  }

  async listByCustomer(customerId, { limit = 20, skip = 0, status } = {}) {
    const filter = { customer_id: customerId };
    if (status) filter.order_status = status;
    return this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
  }

  async updateOrder(orderId, updates, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    const doc = await this.model.findOneAndUpdate(
      { order_id: orderId },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      options,
    );
    return this.toPlain(doc);
  }

  async countTodayOrders() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.model.countDocuments({
      created_at: { $gte: start.toISOString() },
    });
  }
}

export default new OrderRepository();
