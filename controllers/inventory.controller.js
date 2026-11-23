import inventoryService from '../services/inventory.service.js';
import { successResponse } from '../utils/response.util.js';
import { INVENTORY_MESSAGES } from '../constants/inventory.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const getAllInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllInventory(req.query);
    return successResponse(res, HTTP_STATUS.OK, INVENTORY_MESSAGES.INVENTORY_FETCHED, result);
  } catch (error) {
    logger.error('getAllInventory controller failed', { error: error.message });
    return next(error);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const result = await inventoryService.getLowStock(req.query);
    return successResponse(res, HTTP_STATUS.OK, INVENTORY_MESSAGES.LOW_STOCK_FETCHED, result);
  } catch (error) {
    logger.error('getLowStock controller failed', { error: error.message });
    return next(error);
  }
};

export const getInventoryByVariantId = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventoryByVariantId(req.params.variantId, req.query);
    return successResponse(res, HTTP_STATUS.OK, INVENTORY_MESSAGES.INVENTORY_FETCHED, result);
  } catch (error) {
    logger.error('getInventoryByVariantId controller failed', { error: error.message });
    return next(error);
  }
};

export const updateInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.updateInventory(
      req.params.variantId,
      req.body,
      req.user?.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, INVENTORY_MESSAGES.INVENTORY_UPDATED, result);
  } catch (error) {
    logger.error('updateInventory controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  getAllInventory,
  getLowStock,
  getInventoryByVariantId,
  updateInventory,
};
