import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { STOCK_MOVEMENT_TYPES } from '../constants/inventory.constants.js';

const stockMovementSchema = new mongoose.Schema(
  {
    movement_id: { type: String, required: true, unique: true },
    variant_id: { type: String, required: true, index: true },
    product_id: { type: String, required: true, index: true },
    movement_type: { type: String, required: true },
    quantity: { type: Number, required: true },
    previous_available: { type: Number, required: true },
    new_available: { type: Number, required: true },
    previous_reserved: { type: Number, default: 0 },
    new_reserved: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    reference_id: { type: String, default: null },
    created_at: { type: String },
    created_by: { type: String, default: null },
  },
  {
    versionKey: false,
    collection: 'stock_movements',
  },
);

stockMovementSchema.index({ created_at: -1 });
stockMovementSchema.index({ variant_id: 1, created_at: -1 });

export const buildStockMovement = (data, createdBy = null) => ({
  movement_id: data.movement_id || generateId(),
  variant_id: String(data.variant_id).trim(),
  product_id: String(data.product_id).trim(),
  movement_type: data.movement_type || STOCK_MOVEMENT_TYPES.ADJUSTMENT,
  quantity: Number(data.quantity),
  previous_available: Number(data.previous_available),
  new_available: Number(data.new_available),
  previous_reserved: Number(data.previous_reserved ?? 0),
  new_reserved: Number(data.new_reserved ?? 0),
  reason: String(data.reason || '').trim(),
  reference_id: data.reference_id || null,
  created_at: data.created_at || new Date().toISOString(),
  created_by: createdBy || data.created_by || null,
});

const StockMovement =
  mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
