import productRepository from '../repositories/product.repository.js';
import productVariantRepository from '../repositories/productVariant.repository.js';
import categoryRepository from '../repositories/category.repository.js';
import { ensureInventoryForVariant } from './inventory.service.js';
import { PRODUCT_MESSAGES, PRODUCT_STATUS } from '../constants/product.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { localizeMany, withLocalizedFields, normalizeLanguage } from '../utils/i18n.util.js';
import { slugify } from '../utils/slug.util.js';
import logger from '../config/logger.js';

const localizeProduct = (product, language) =>
  withLocalizedFields(product, ['name', 'description'], language);

const assertCategoriesExist = async (categoryIds = []) => {
  if (!categoryIds.length) return;
  const found = await categoryRepository.getCategoriesByIds(categoryIds);
  if (found.length !== categoryIds.length) {
    throw new AppError(
      PRODUCT_MESSAGES.INVALID_CATEGORIES,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.BUSINESS_VALIDATION_ERROR,
    );
  }
};

const attachVariants = async (product) => {
  const result = await productVariantRepository.listByProductId(product.product_id, { limit: 100 });
  return { ...product, variants: result.items };
};

export const createProduct = async (payload, userId) => {
  try {
    const categoryIds = payload.category_ids || [];
    await assertCategoriesExist(categoryIds);

    const slug = payload.product_slug ? slugify(payload.product_slug) : slugify(payload.name_en);
    const existingSlug = await productRepository.getProductBySlug(slug);
    if (existingSlug) {
      throw new AppError(
        PRODUCT_MESSAGES.PRODUCT_SLUG_EXISTS,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      );
    }

    const existingSku = await productRepository.getProductBySku(payload.sku);
    if (existingSku) {
      throw new AppError(
        PRODUCT_MESSAGES.PRODUCT_SKU_EXISTS,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      );
    }

    const { variants: variantPayloads = [], ...productPayload } = payload;
    const product = await productRepository.createProduct(
      { ...productPayload, product_slug: slug },
      userId,
    );

    const variants = [];
    for (const variantData of variantPayloads) {
      const variant = await createVariantInternal(product.product_id, variantData, userId);
      variants.push(variant);
    }

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: 'PRODUCTS',
      newData: { ...product, variants },
    });

    return { ...product, variants };
  } catch (error) {
    logger.error('createProduct service failed', { error: error.message });
    throw error;
  }
};

const createVariantInternal = async (productId, payload, userId) => {
  const existingSku = await productVariantRepository.getVariantBySku(payload.sku);
  if (existingSku) {
    throw new AppError(
      PRODUCT_MESSAGES.VARIANT_SKU_EXISTS,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
    );
  }

  const variant = await productVariantRepository.createVariant(
    { ...payload, product_id: productId },
    userId,
  );

  await ensureInventoryForVariant(
    variant,
    { low_stock_threshold: payload.low_stock_threshold },
    userId,
  );

  return variant;
};

export const createProductVariant = async (productId, payload, userId) => {
  try {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new AppError(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const variant = await createVariantInternal(productId, payload, userId);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: 'PRODUCT_VARIANTS',
      newData: variant,
    });
    return variant;
  } catch (error) {
    logger.error('createProductVariant service failed', { error: error.message, productId });
    throw error;
  }
};

export const getAllProducts = async (query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const { page, limit, skip } = parsePaginationQuery(query, 20);
    const result = await productRepository.listProducts({ ...query, limit, skip });

    const products = await Promise.all(
      result.items.map(async (product) => {
        const withVariants = query.include_variants === 'true' || query.include_variants === true
          ? await attachVariants(product)
          : product;
        return localizeProduct(withVariants, language);
      }),
    );

    return {
      products,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: products.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllProducts service failed', { error: error.message });
    throw error;
  }
};

export const getPublicProducts = async (query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const { page, limit, skip } = parsePaginationQuery(query, 20);
    const result = await productRepository.listActiveProducts({ ...query, limit, skip });

    const products = await Promise.all(
      result.items.map(async (product) => {
        const withVariants = await attachVariants(product);
        return localizeProduct(
          {
            ...withVariants,
            variants: withVariants.variants.filter((v) => v.status !== 'inactive'),
          },
          language,
        );
      }),
    );

    return {
      products,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: products.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getPublicProducts service failed', { error: error.message });
    throw error;
  }
};

export const searchProducts = async (query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const { page, limit, skip } = parsePaginationQuery(query, 20);
    const search = query.q || query.search || '';

    if (!String(search).trim()) {
      throw new AppError(
        'Search query (q) is required',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const status = query.status || PRODUCT_STATUS.ACTIVE;
    const result = await productRepository.searchProducts({
      search,
      language,
      status: query.admin === 'true' ? query.status : status,
      limit,
      skip,
    });

    const products = await Promise.all(
      result.items.map(async (product) => localizeProduct(await attachVariants(product), language)),
    );

    return {
      products,
      query: search,
      language,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: products.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('searchProducts service failed', { error: error.message });
    throw error;
  }
};

export const getProductById = async (productId, query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new AppError(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const withVariants = await attachVariants(product);
    const categories = await categoryRepository.getCategoriesByIds(product.category_ids || []);

    return {
      ...localizeProduct(withVariants, language),
      categories: localizeMany(categories, ['name', 'description'], language),
    };
  } catch (error) {
    logger.error('getProductById service failed', { error: error.message, productId });
    throw error;
  }
};

export const updateProduct = async (productId, payload, userId) => {
  try {
    const existing = await productRepository.getProductById(productId);
    if (!existing) {
      throw new AppError(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (payload.category_ids) {
      await assertCategoriesExist(payload.category_ids);
    }

    const updates = { ...payload, updated_by: userId };
    delete updates.variants;

    if (payload.product_slug || payload.name_en) {
      const slug = payload.product_slug
        ? slugify(payload.product_slug)
        : payload.name_en
          ? slugify(payload.name_en)
          : existing.product_slug;

      if (slug !== existing.product_slug) {
        const duplicate = await productRepository.getProductBySlug(slug);
        if (duplicate) {
          throw new AppError(
            PRODUCT_MESSAGES.PRODUCT_SLUG_EXISTS,
            HTTP_STATUS.CONFLICT,
            ERROR_CODES.RESOURCE_ALREADY_EXISTS,
          );
        }
      }
      updates.product_slug = slug;
    }

    if (payload.sku && payload.sku.toUpperCase() !== existing.sku) {
      const duplicateSku = await productRepository.getProductBySku(payload.sku);
      if (duplicateSku) {
        throw new AppError(
          PRODUCT_MESSAGES.PRODUCT_SKU_EXISTS,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        );
      }
      updates.sku = String(payload.sku).trim().toUpperCase();
    }

    const updated = await productRepository.updateProduct(productId, updates);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'PRODUCTS',
      oldData: existing,
      newData: updated,
    });
    return attachVariants(updated);
  } catch (error) {
    logger.error('updateProduct service failed', { error: error.message, productId });
    throw error;
  }
};

export const deleteProduct = async (productId, userId) => {
  try {
    const existing = await productRepository.getProductById(productId);
    if (!existing) {
      throw new AppError(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await productVariantRepository.softDeleteByProductId(productId, userId);
    const deleted = await productRepository.softDeleteProduct(productId, userId);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: 'PRODUCTS',
      oldData: existing,
    });
    return deleted;
  } catch (error) {
    logger.error('deleteProduct service failed', { error: error.message, productId });
    throw error;
  }
};

export const getProductVariants = async (productId) => {
  const product = await productRepository.getProductById(productId);
  if (!product) {
    throw new AppError(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  const result = await productVariantRepository.listByProductId(productId, { limit: 100 });
  return { product_id: productId, variants: result.items };
};

export const updateProductVariant = async (productId, variantId, payload, userId) => {
  try {
    const product = await productRepository.getProductById(productId);
    if (!product) {
      throw new AppError(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const existing = await productVariantRepository.getVariantById(variantId);
    if (!existing || existing.product_id !== productId) {
      throw new AppError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updates = { ...payload, updated_by: userId };
    delete updates.stock_quantity;

    if (payload.sku && payload.sku.toUpperCase() !== existing.sku) {
      const duplicateSku = await productVariantRepository.getVariantBySku(payload.sku);
      if (duplicateSku) {
        throw new AppError(
          PRODUCT_MESSAGES.VARIANT_SKU_EXISTS,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        );
      }
      updates.sku = String(payload.sku).trim().toUpperCase();
    }

    const updated = await productVariantRepository.updateVariant(variantId, updates);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'PRODUCT_VARIANTS',
      oldData: existing,
      newData: updated,
    });
    return updated;
  } catch (error) {
    logger.error('updateProductVariant service failed', { error: error.message, variantId });
    throw error;
  }
};

export const deleteProductVariant = async (productId, variantId, userId) => {
  try {
    const existing = await productVariantRepository.getVariantById(variantId);
    if (!existing || existing.product_id !== productId) {
      throw new AppError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const deleted = await productVariantRepository.softDeleteVariant(variantId, userId);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: 'PRODUCT_VARIANTS',
      oldData: existing,
    });
    return deleted;
  } catch (error) {
    logger.error('deleteProductVariant service failed', { error: error.message, variantId });
    throw error;
  }
};

export default {
  createProduct,
  createProductVariant,
  getAllProducts,
  getPublicProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductVariants,
  updateProductVariant,
  deleteProductVariant,
};
