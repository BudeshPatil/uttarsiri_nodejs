import BaseRepository from './base.repository.js';
import Address, { buildAddress } from '../models/address.model.js';

class AddressRepository extends BaseRepository {
  constructor() {
    super(Address);
  }

  async createAddress(data) {
    const address = buildAddress(data);
    await this.createItem(address);
    return address;
  }

  async getById(addressId) {
    const address = await this.getItem({ address_id: addressId });
    if (!address || address.is_deleted) return null;
    return address;
  }

  async listByUser(userId) {
    return this.findItems(
      { user_id: userId, is_deleted: { $ne: true } },
      { limit: 50, skip: 0, sort: { is_default: -1, updated_at: -1 } },
    );
  }

  async updateAddress(addressId, updates) {
    return this.updateItem(
      { address_id: addressId },
      { ...updates, updated_at: new Date().toISOString() },
      { extraFilter: { is_deleted: { $ne: true } } },
    );
  }

  async softDelete(addressId) {
    return this.updateItem(
      { address_id: addressId },
      { is_deleted: true, is_default: false, updated_at: new Date().toISOString() },
    );
  }

  async clearDefault(userId) {
    await this.model.updateMany(
      { user_id: userId, is_deleted: { $ne: true }, is_default: true },
      { $set: { is_default: false, updated_at: new Date().toISOString() } },
    );
  }
}

export default new AddressRepository();
