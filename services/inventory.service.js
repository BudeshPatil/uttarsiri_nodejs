import inventoryRepository from '../repositories/inventory.repository.js';
import productVariantRepository from '../repositories/productVariant.repository.js';
import { INVENTORY_MESSAGES, STOCK_MOVEMENT_TYPES } from '../constants/inventory.constants.js';
import { VARIANT_STATUS } from '../constants/product.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const ensureInventoryForVariant = async (variant, { low_stock_threshold } = {}, userId = null) => {
  const existing = await inventoryRepository.getByVariantId(variant.variant_id);
  if (existing) return existing;

  const inventory = await inventoryRepository.createInventory({
    variant_id: variant.variant_id,
    product_id: variant.product_id,
    available_stock: variant.stock_quantity || 0,
    reserved_stock: 0,
    low_stock_threshold: low_stock_threshold ?? 5,
    updated_by: userId,
  });

  await inventoryRepository.createStockMovement(
    {
      variant_id: variant.variant_id,
      product_id: variant.product_id,
      movement_type: STOCK_MOVEMENT_TYPES.INITIAL,
      quantity: inventory.available_stock,
      previous_available: 0,
      new_available: inventory.available_stock,
      previous_reserved: 0,
      new_reserved: 0,
      reason: 'Initial inventory on variant create',
    },
    userId,
  );

  return inventory;
};

export const getAllInventory = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 20);
    const result = await inventoryRepository.listInventory({ ...query, limit, skip });

    const items = await Promise.all(
      result.items.map(async (inventory) => {
        const variant = await productVariantRepository.getVariantById(inventory.variant_id);
        return { ...inventory, variant };
      }),
    );

    return {
      inventory: items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllInventory service failed', { error: error.message });
    throw error;
  }
};

export const getLowStock = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 20);
    const result = await inventoryRepository.listLowStock({ limit, skip });

    const items = await Promise.all(
      result.items.map(async (inventory) => {
        const variant = await productVariantRepository.getVariantById(inventory.variant_id);
        return { ...inventory, variant };
      }),
    );

    return {
      inventory: items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getLowStock service failed', { error: error.message });
    throw error;
  }
};

export const getInventoryByVariantId = async (variantId, query = {}) => {
  try {
    const inventory = await inventoryRepository.getByVariantId(variantId);
    if (!inventory) {
      throw new AppError(INVENTORY_MESSAGES.INVENTORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const { page, limit, skip } = parsePaginationQuery(query, 20);
    const movements = await inventoryRepository.listStockMovements(variantId, { limit, skip });
    const variant = await productVariantRepository.getVariantById(variantId);

    return {
      ...inventory,
      variant,
      movements: movements.items,
      movements_pagination: buildPaginationMeta({
        page,
        limit,
        count: movements.items.length,
        total: movements.total,
      }),
    };
  } catch (error) {
    logger.error('getInventoryByVariantId service failed', { error: error.message, variantId });
    throw error;
  }
};

/**
 * Update inventory for a variant.
 * Supports absolute set via available_stock / reserved_stock / low_stock_threshold,
 * or relative adjustment via adjustment (+/-) and optional movement_type.
 */
export const updateInventory = async (variantId, payload, userId) => {
  try {
    const variant = await productVariantRepository.getVariantById(variantId);
    if (!variant) {
      throw new AppError('Product variant not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    let inventory = await inventoryRepository.getByVariantId(variantId);
    if (!inventory) {
      inventory = await ensureInventoryForVariant(variant, payload, userId);
    }

    const previousAvailable = inventory.available_stock;
    const previousReserved = inventory.reserved_stock;

    let nextAvailable = previousAvailable;
    let nextReserved = previousReserved;
    let movementType = payload.movement_type || STOCK_MOVEMENT_TYPES.ADJUSTMENT;
    let quantityDelta = 0;

    if (payload.adjustment !== undefined) {
      quantityDelta = Number(payload.adjustment);
      if (!Number.isFinite(quantityDelta)) {
        throw new AppError(
          INVENTORY_MESSAGES.INVALID_ADJUSTMENT,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
      nextAvailable = previousAvailable + quantityDelta;
    } else if (payload.available_stock !== undefined) {
      nextAvailable = Number(payload.available_stock);
      quantityDelta = nextAvailable - previousAvailable;
    }

    if (payload.reserved_stock !== undefined) {
      nextReserved = Number(payload.reserved_stock);
    } else if (payload.reserve !== undefined) {
      const reserveQty = Number(payload.reserve);
      if (reserveQty > nextAvailable) {
        throw new AppError(
          INVENTORY_MESSAGES.INSUFFICIENT_STOCK,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.BUSINESS_VALIDATION_ERROR,
        );
      }
      nextAvailable -= reserveQty;
      nextReserved += reserveQty;
      movementType = STOCK_MOVEMENT_TYPES.RESERVE;
      quantityDelta = -reserveQty;
    } else if (payload.release !== undefined) {
      const releaseQty = Number(payload.release);
      if (releaseQty > nextReserved) {
        throw new AppError(
          INVENTORY_MESSAGES.INVALID_ADJUSTMENT,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.BUSINESS_VALIDATION_ERROR,
        );
      }
      nextReserved -= releaseQty;
      nextAvailable += releaseQty;
      movementType = STOCK_MOVEMENT_TYPES.RELEASE;
      quantityDelta = releaseQty;
    }

    if (nextAvailable < 0 || nextReserved < 0) {
      throw new AppError(
        INVENTORY_MESSAGES.INSUFFICIENT_STOCK,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.BUSINESS_VALIDATION_ERROR,
      );
    }

    const updates = {
      available_stock: nextAvailable,
      reserved_stock: nextReserved,
      updated_by: userId,
    };

    if (payload.low_stock_threshold !== undefined) {
      updates.low_stock_threshold = Number(payload.low_stock_threshold);
    }

    const updated = await inventoryRepository.updateByVariantId(variantId, updates);

    await productVariantRepository.syncStockQuantity(variantId, nextAvailable);

    if (quantityDelta !== 0 || payload.reserve !== undefined || payload.release !== undefined) {
      await inventoryRepository.createStockMovement(
        {
          variant_id: variantId,
          product_id: variant.product_id,
          movement_type: movementType,
          quantity: quantityDelta,
          previous_available: previousAvailable,
          new_available: nextAvailable,
          previous_reserved: previousReserved,
          new_reserved: nextReserved,
          reason: payload.reason || '',
          reference_id: payload.reference_id || null,
        },
        userId,
      );
    }

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'INVENTORY',
      oldData: inventory,
      newData: updated,
    });

    return {
      ...updated,
      is_low_stock: updated.available_stock <= updated.low_stock_threshold,
      is_out_of_stock: updated.available_stock <= 0,
    };
  } catch (error) {
    logger.error('updateInventory service failed', { error: error.message, variantId });
    throw error;
  }
};

export default {
  ensureInventoryForVariant,
  getAllInventory,
  getLowStock,
  getInventoryByVariantId,
  updateInventory,
  VARIANT_STATUS,
};
