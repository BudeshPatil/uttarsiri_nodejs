import BaseRepository from './base.repository.js';
import ProductVariant, { buildProductVariant } from '../models/productVariant.model.js';
import { VARIANT_STATUS } from '../constants/product.constants.js';

class ProductVariantRepository extends BaseRepository {
  constructor() {
    super(ProductVariant);
  }

  async createVariant(data, createdBy = null) {
    const variant = buildProductVariant(data, createdBy);
    await this.createItem(variant);
    return variant;
  }

  async getVariantById(variantId) {
    const variant = await this.getItem({ variant_id: variantId });
    if (variant?.is_deleted) return null;
    return variant;
  }

  async getVariantBySku(sku) {
    return this.getItem({ sku: String(sku).trim().toUpperCase(), is_deleted: { $ne: true } });
  }

  async updateVariant(variantId, updates) {
    return this.updateItem(
      { variant_id: variantId },
      { ...updates, updated_at: new Date().toISOString() },
    );
  }

  async softDeleteVariant(variantId, updatedBy = null) {
    return this.updateItem(
      { variant_id: variantId },
      { is_deleted: true, updated_at: new Date().toISOString(), updated_by: updatedBy },
    );
  }

  async listByProductId(productId, { status, limit = 100, skip = 0 } = {}) {
    const filter = { product_id: productId, is_deleted: { $ne: true } };
    if (status) filter.status = status;
    return this.findItems(filter, {
      limit,
      skip,
      sort: { weight: 1, created_at: 1 },
    });
  }

  async softDeleteByProductId(productId, updatedBy = null) {
    await this.model.updateMany(
      { product_id: productId, is_deleted: { $ne: true } },
      {
        $set: {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      },
    );
  }

  async syncStockQuantity(variantId, availableStock) {
    const stock = Number(availableStock) || 0;
    const updates = {
      stock_quantity: stock,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.getVariantById(variantId);
    if (!existing) return null;

    if (stock <= 0 && existing.status !== VARIANT_STATUS.INACTIVE) {
      updates.status = VARIANT_STATUS.OUT_OF_STOCK;
    } else if (stock > 0 && existing.status === VARIANT_STATUS.OUT_OF_STOCK) {
      updates.status = VARIANT_STATUS.ACTIVE;
    }

    return this.updateVariant(variantId, updates);
  }
}

export default new ProductVariantRepository();
