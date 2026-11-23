import productService from '../services/product.service.js';
import { successResponse } from '../utils/response.util.js';
import { PRODUCT_MESSAGES } from '../constants/product.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, PRODUCT_MESSAGES.PRODUCT_CREATED, product);
  } catch (error) {
    logger.error('createProduct controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProducts(req.query);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.PRODUCTS_FETCHED, result);
  } catch (error) {
    logger.error('getAllProducts controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicProducts = async (req, res, next) => {
  try {
    const result = await productService.getPublicProducts(req.query);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.PRODUCTS_FETCHED, result);
  } catch (error) {
    logger.error('getPublicProducts controller failed', { error: error.message });
    return next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const result = await productService.searchProducts(req.query);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.SEARCH_COMPLETED, result);
  } catch (error) {
    logger.error('searchProducts controller failed', { error: error.message });
    return next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id, req.query);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.PRODUCT_FETCHED, product);
  } catch (error) {
    logger.error('getProductById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.PRODUCT_UPDATED, product);
  } catch (error) {
    logger.error('updateProduct controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await productService.deleteProduct(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.PRODUCT_DELETED, product);
  } catch (error) {
    logger.error('deleteProduct controller failed', { error: error.message });
    return next(error);
  }
};

export const createProductVariant = async (req, res, next) => {
  try {
    const variant = await productService.createProductVariant(
      req.params.id,
      req.body,
      req.user?.user_id,
    );
    return successResponse(res, HTTP_STATUS.CREATED, PRODUCT_MESSAGES.VARIANT_CREATED, variant);
  } catch (error) {
    logger.error('createProductVariant controller failed', { error: error.message });
    return next(error);
  }
};

export const getProductVariants = async (req, res, next) => {
  try {
    const result = await productService.getProductVariants(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.VARIANTS_FETCHED, result);
  } catch (error) {
    logger.error('getProductVariants controller failed', { error: error.message });
    return next(error);
  }
};

export const updateProductVariant = async (req, res, next) => {
  try {
    const variant = await productService.updateProductVariant(
      req.params.id,
      req.params.variantId,
      req.body,
      req.user?.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.VARIANT_UPDATED, variant);
  } catch (error) {
    logger.error('updateProductVariant controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteProductVariant = async (req, res, next) => {
  try {
    const variant = await productService.deleteProductVariant(
      req.params.id,
      req.params.variantId,
      req.user?.user_id,
    );
    return successResponse(res, HTTP_STATUS.OK, PRODUCT_MESSAGES.VARIANT_DELETED, variant);
  } catch (error) {
    logger.error('deleteProductVariant controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createProduct,
  getAllProducts,
  getPublicProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createProductVariant,
  getProductVariants,
  updateProductVariant,
  deleteProductVariant,
};
