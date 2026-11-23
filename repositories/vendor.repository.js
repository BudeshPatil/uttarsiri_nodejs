import BaseRepository from './base.repository.js';
import Vendor, { buildVendor } from '../models/vendor.model.js';

class VendorRepository extends BaseRepository {
  constructor() {
    super(Vendor);
  }

  async createVendor(data) {
    const vendor = buildVendor(data);
    await this.createItem(vendor);
    return vendor;
  }

  async getById(vendorId) {
    const vendor = await this.getItem({ vendor_id: vendorId });
    if (!vendor || vendor.is_deleted) return null;
    return vendor;
  }

  async getByUserId(userId) {
    const vendor = await this.getItem({ user_id: userId });
    if (!vendor || vendor.is_deleted) return null;
    return vendor;
  }

  async listVendors({ status, limit = 20, skip = 0, search } = {}) {
    const filter = { is_deleted: { $ne: true } };
    if (status) filter.status = status;
    if (search) {
      const term = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { business_name: term },
        { owner_name: term },
        { email: term },
        { mobile: term },
        { gstin: term },
      ];
    }
    return this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
  }

  async updateVendor(vendorId, updates) {
    return this.updateItem(
      { vendor_id: vendorId },
      { ...updates, updated_at: new Date().toISOString() },
      { extraFilter: { is_deleted: { $ne: true } } },
    );
  }
}

export default new VendorRepository();
