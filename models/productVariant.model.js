import mongoose from 'mongoose';
import { generateId } from '../utils/uuid.util.js';
import { VARIANT_STATUS } from '../constants/product.constants.js';

const productVariantSchema = new mongoose.Schema(
  {
    variant_id: { type: String, required: true, unique: true },
    product_id: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    weight: { type: Number, required: true },
    unit: { type: String, required: true },
    selling_price: { type: Number, required: true },
    original_price: { type: Number, required: true },
    stock_quantity: { type: Number, default: 0 },
    minimum_order_quantity: { type: Number, default: 1 },
    status: { type: String, default: VARIANT_STATUS.ACTIVE },
    created_at: { type: String },
    updated_at: { type: String },
    created_by: { type: String, default: null },
    updated_by: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    collection: 'product_variants',
  },
);

productVariantSchema.index({ sku: 1 }, { unique: true });
productVariantSchema.index({ product_id: 1, is_deleted: 1, status: 1 });

export const buildProductVariant = (data, createdBy = null) => {
  const now = new Date().toISOString();
  const stock = Number.isFinite(Number(data.stock_quantity)) ? Number(data.stock_quantity) : 0;
  let status = data.status || VARIANT_STATUS.ACTIVE;
  if (stock <= 0 && status === VARIANT_STATUS.ACTIVE) {
    status = VARIANT_STATUS.OUT_OF_STOCK;
  }

  return {
    variant_id: data.variant_id || generateId(),
    product_id: String(data.product_id).trim(),
    sku: String(data.sku || '').trim().toUpperCase(),
    weight: Number(data.weight),
    unit: String(data.unit || '').trim().toLowerCase(),
    selling_price: Number(data.selling_price),
    original_price: Number(data.original_price ?? data.selling_price),
    stock_quantity: stock,
    minimum_order_quantity: Math.max(
      1,
      Number.isFinite(Number(data.minimum_order_quantity)) ? Number(data.minimum_order_quantity) : 1,
    ),
    status,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    created_by: createdBy || data.created_by || null,
    updated_by: data.updated_by || null,
    is_deleted: data.is_deleted ?? false,
  };
};

const ProductVariant =
  mongoose.models.ProductVariant || mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;
