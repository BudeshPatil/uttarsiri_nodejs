import BaseRepository from './base.repository.js';
import Inventory, { buildInventory } from '../models/inventory.model.js';
import StockMovement, { buildStockMovement } from '../models/stockMovement.model.js';

class InventoryRepository extends BaseRepository {
  constructor() {
    super(Inventory);
    this.movementModel = StockMovement;
  }

  async createInventory(data) {
    const inventory = buildInventory(data);
    await this.createItem(inventory);
    return inventory;
  }

  async getByVariantId(variantId) {
    return this.getItem({ variant_id: variantId });
  }

  async updateByVariantId(variantId, updates) {
    return this.updateItem(
      { variant_id: variantId },
      { ...updates, updated_at: new Date().toISOString() },
    );
  }

  async listInventory({ product_id, low_stock_only, limit = 50, skip = 0 } = {}) {
    const filter = {};
    if (product_id) filter.product_id = product_id;

    if (low_stock_only === true || low_stock_only === 'true') {
      filter.$expr = { $lte: ['$available_stock', '$low_stock_threshold'] };
    }

    return this.findItems(filter, {
      limit,
      skip,
      sort: { available_stock: 1, updated_at: -1 },
    });
  }

  async listLowStock({ limit = 50, skip = 0 } = {}) {
    return this.listInventory({ low_stock_only: true, limit, skip });
  }

  async createStockMovement(data, createdBy = null) {
    const movement = buildStockMovement(data, createdBy);
    const created = await this.movementModel.create(movement);
    return this.toPlain(created);
  }

  async listStockMovements(variantId, { limit = 50, skip = 0 } = {}) {
    const [docs, total] = await Promise.all([
      this.movementModel
        .find({ variant_id: variantId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.movementModel.countDocuments({ variant_id: variantId }),
    ]);

    return this.buildPageResult(this.toPlainMany(docs), limit, skip, total);
  }
}

export default new InventoryRepository();
