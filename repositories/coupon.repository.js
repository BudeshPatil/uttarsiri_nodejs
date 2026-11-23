import BaseRepository from './base.repository.js';
import Coupon, { buildCoupon } from '../models/coupon.model.js';

class CouponRepository extends BaseRepository {
  constructor() {
    super(Coupon);
  }

  async createCoupon(data, createdBy = null) {
    const coupon = buildCoupon(data, createdBy);
    await this.createItem(coupon);
    return coupon;
  }

  async getById(couponId) {
    const coupon = await this.getItem({ coupon_id: couponId });
    if (!coupon || coupon.is_deleted) return null;
    return coupon;
  }

  async getByCode(code) {
    const coupon = await this.getItem({
      code: String(code || '')
        .trim()
        .toUpperCase(),
    });
    if (!coupon || coupon.is_deleted) return null;
    return coupon;
  }

  async listCoupons({ status, limit = 50, skip = 0 } = {}) {
    const filter = { is_deleted: { $ne: true } };
    if (status) filter.status = status;
    return this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
  }

  async updateCoupon(couponId, updates) {
    return this.updateItem(
      { coupon_id: couponId },
      { ...updates, updated_at: new Date().toISOString() },
    );
  }

  async softDelete(couponId) {
    return this.updateItem(
      { coupon_id: couponId },
      { is_deleted: true, updated_at: new Date().toISOString() },
    );
  }

  async incrementUsage(couponId, session = null) {
    const options = { new: true };
    if (session) options.session = session;
    const doc = await this.model.findOneAndUpdate(
      { coupon_id: couponId },
      { $inc: { used_count: 1 }, $set: { updated_at: new Date().toISOString() } },
      options,
    );
    return this.toPlain(doc);
  }
}

export default new CouponRepository();
