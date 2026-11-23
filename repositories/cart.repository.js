import BaseRepository from './base.repository.js';
import Cart, { buildCart } from '../models/cart.model.js';

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart);
  }

  async getByUserId(userId) {
    return this.getItem({ user_id: userId });
  }

  async createCart(userId) {
    const cart = buildCart({ user_id: userId, items: [] });
    await this.createItem(cart);
    return cart;
  }

  async saveCart(userId, updates) {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      const cart = buildCart({ user_id: userId, ...updates });
      await this.createItem(cart);
      return cart;
    }
    return this.updateItem(
      { user_id: userId },
      { ...updates, updated_at: new Date().toISOString() },
    );
  }

  async clearCart(userId) {
    return this.saveCart(userId, { items: [], coupon_code: null });
  }
}

export default new CartRepository();
