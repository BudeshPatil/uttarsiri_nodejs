import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';

const inventorySchema = new mongoose.Schema(
  {
    inventory_id: { type: String, required: true, unique: true },
    variant_id: { type: String, required: true, unique: true },
    product_id: { type: String, required: true, index: true },
    available_stock: { type: Number, default: 0 },
    reserved_stock: { type: Number, default: 0 },
    low_stock_threshold: { type: Number, default: 5 },
    created_at: { type: String },
    updated_at: { type: String },
    updated_by: { type: String, default: null },
  },
  {
    versionKey: false,
    collection: 'inventories',
  },
);

inventorySchema.index({ available_stock: 1 });
inventorySchema.index({ product_id: 1, available_stock: 1 });

export const buildInventory = (data) => {
  const now = new Date().toISOString();
  return {
    inventory_id: data.inventory_id || generateId(),
    variant_id: String(data.variant_id).trim(),
    product_id: String(data.product_id).trim(),
    available_stock: Number.isFinite(Number(data.available_stock)) ? Number(data.available_stock) : 0,
    reserved_stock: Number.isFinite(Number(data.reserved_stock)) ? Number(data.reserved_stock) : 0,
    low_stock_threshold: Number.isFinite(Number(data.low_stock_threshold))
      ? Number(data.low_stock_threshold)
      : 5,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    updated_by: data.updated_by || null,
  };
};

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

export default Inventory;
