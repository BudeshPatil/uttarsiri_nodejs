import categoryRepository from '../repositories/category.repository.js';
import productRepository from '../repositories/product.repository.js';
import { CATEGORY_MESSAGES, CATEGORY_STATUS } from '../constants/category.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { localizeMany, withLocalizedFields, normalizeLanguage } from '../utils/i18n.util.js';
import { slugify } from '../utils/slug.util.js';
import logger from '../config/logger.js';

const localizeCategory = (category, language) =>
  withLocalizedFields(category, ['name', 'description'], language);

const buildTree = (categories, language) => {
  const localized = localizeMany(categories, ['name', 'description'], language);
  const byParent = new Map();

  for (const category of localized) {
    const parentKey = category.parent_category_id || 'root';
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey).push({ ...category, children: [] });
  }

  const attach = (nodes) =>
    nodes.map((node) => {
      const children = byParent.get(node.category_id) || [];
      return { ...node, children: attach(children) };
    });

  return attach(byParent.get('root') || []);
};

export const createCategory = async (payload, userId) => {
  try {
    if (payload.parent_category_id) {
      const parent = await categoryRepository.getCategoryById(payload.parent_category_id);
      if (!parent) {
        throw new AppError(CATEGORY_MESSAGES.PARENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    const slug = payload.category_slug ? slugify(payload.category_slug) : slugify(payload.name_en);
    const existingSlug = await categoryRepository.getCategoryBySlug(slug);
    if (existingSlug) {
      throw new AppError(
        CATEGORY_MESSAGES.CATEGORY_SLUG_EXISTS,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      );
    }

    const category = await categoryRepository.createCategory({ ...payload, category_slug: slug }, userId);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: 'CATEGORIES',
      newData: category,
    });
    return category;
  } catch (error) {
    logger.error('createCategory service failed', { error: error.message });
    throw error;
  }
};

export const getAllCategories = async (query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const { page, limit, skip } = parsePaginationQuery(query, 50);
    const result = await categoryRepository.listCategories({ ...query, limit, skip });

    if (query.tree === 'true' || query.tree === true) {
      const all = await categoryRepository.listCategories({
        status: query.status,
        search: query.search,
        limit: 500,
        skip: 0,
      });
      return {
        categories: buildTree(all.items, language),
        pagination: buildPaginationMeta({
          page: 1,
          limit: all.items.length || 1,
          count: all.items.length,
          total: all.total,
        }),
      };
    }

    return {
      categories: localizeMany(result.items, ['name', 'description'], language),
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllCategories service failed', { error: error.message });
    throw error;
  }
};

export const getPublicCategories = async (query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const result = await categoryRepository.listActiveCategories({
      limit: Math.min(500, Math.max(1, Number(query.limit) || 200)),
    });

    if (query.tree === 'false') {
      return { categories: localizeMany(result.items, ['name', 'description'], language) };
    }

    return { categories: buildTree(result.items, language) };
  } catch (error) {
    logger.error('getPublicCategories service failed', { error: error.message });
    throw error;
  }
};

export const getCategoryById = async (categoryId, query = {}) => {
  try {
    const language = normalizeLanguage(query.lang || query.language);
    const category = await categoryRepository.getCategoryById(categoryId);
    if (!category) {
      throw new AppError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const children = await categoryRepository.listCategories({
      parent_category_id: categoryId,
      limit: 200,
      skip: 0,
    });

    return {
      ...localizeCategory(category, language),
      children: localizeMany(children.items, ['name', 'description'], language),
    };
  } catch (error) {
    logger.error('getCategoryById service failed', { error: error.message, categoryId });
    throw error;
  }
};

export const updateCategory = async (categoryId, payload, userId) => {
  try {
    const existing = await categoryRepository.getCategoryById(categoryId);
    if (!existing) {
      throw new AppError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (payload.parent_category_id === categoryId) {
      throw new AppError(
        CATEGORY_MESSAGES.INVALID_PARENT,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.BUSINESS_VALIDATION_ERROR,
      );
    }

    if (payload.parent_category_id) {
      const parent = await categoryRepository.getCategoryById(payload.parent_category_id);
      if (!parent) {
        throw new AppError(CATEGORY_MESSAGES.PARENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    const updates = { ...payload, updated_by: userId };

    if (payload.category_slug || payload.name_en) {
      const slug = payload.category_slug
        ? slugify(payload.category_slug)
        : payload.name_en
          ? slugify(payload.name_en)
          : existing.category_slug;

      if (slug !== existing.category_slug) {
        const duplicate = await categoryRepository.getCategoryBySlug(slug);
        if (duplicate) {
          throw new AppError(
            CATEGORY_MESSAGES.CATEGORY_SLUG_EXISTS,
            HTTP_STATUS.CONFLICT,
            ERROR_CODES.RESOURCE_ALREADY_EXISTS,
          );
        }
      }
      updates.category_slug = slug;
    }

    const updated = await categoryRepository.updateCategory(categoryId, updates);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'CATEGORIES',
      oldData: existing,
      newData: updated,
    });
    return updated;
  } catch (error) {
    logger.error('updateCategory service failed', { error: error.message, categoryId });
    throw error;
  }
};

export const deleteCategory = async (categoryId, userId) => {
  try {
    const existing = await categoryRepository.getCategoryById(categoryId);
    if (!existing) {
      throw new AppError(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const childCount = await categoryRepository.countChildren(categoryId);
    if (childCount > 0) {
      throw new AppError(
        'Cannot delete category with active subcategories',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.BUSINESS_VALIDATION_ERROR,
      );
    }

    const productsUsing = await productRepository.listProducts({
      category_id: categoryId,
      limit: 1,
      skip: 0,
    });
    if (productsUsing.total > 0) {
      throw new AppError(
        'Cannot delete category assigned to products. Reassign products first.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.BUSINESS_VALIDATION_ERROR,
      );
    }

    const deleted = await categoryRepository.softDeleteCategory(categoryId, userId);
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: 'CATEGORIES',
      oldData: existing,
    });
    return deleted;
  } catch (error) {
    logger.error('deleteCategory service failed', { error: error.message, categoryId });
    throw error;
  }
};

export default {
  createCategory,
  getAllCategories,
  getPublicCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  CATEGORY_STATUS,
};
