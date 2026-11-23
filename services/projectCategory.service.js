import projectCategoryRepository from '../repositories/projectCategory.repository.js';
import Project from '../models/project.model.js';
import { slugifyCategory } from '../models/projectCategory.model.js';
import { PROJECT_CATEGORY_MESSAGES } from '../constants/projectCategory.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

/**
 * Projects store the category as free text, so the stored value may differ from
 * the category name by case or stray whitespace ("  interior "). Every lookup
 * here normalises both sides — an exact match would undercount, let a category
 * be deleted while projects still use it, and leave those projects behind on a
 * rename, which is precisely what this module exists to prevent.
 */
const categoryNameMatcher = (name) => {
  const escaped = String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i');
};

const projectsInCategoryFilter = (name) => ({
  category: categoryNameMatcher(name),
  is_deleted: { $ne: true },
});

/** How many live projects sit in each category, keyed by trimmed lower-cased name. */
const countProjectsByCategory = async ({ publishedOnly = false } = {}) => {
  const match = { is_deleted: { $ne: true } };
  if (publishedOnly) match.status = 'published';

  const rows = await Project.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $toLower: { $trim: { input: { $ifNull: ['$category', ''] } } } },
        count: { $sum: 1 },
      },
    },
  ]);

  return rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
};

const withProjectCounts = (categories, counts) =>
  categories.map((category) => ({
    ...category,
    project_count: counts[String(category.name).trim().toLowerCase()] || 0,
  }));

export const createCategory = async (payload, userId) => {
  try {
    const name = String(payload.name || '').trim();
    const duplicate = await projectCategoryRepository.getCategoryByName(name);
    if (duplicate) {
      throw new AppError(
        PROJECT_CATEGORY_MESSAGES.CATEGORY_NAME_EXISTS,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      );
    }

    const category = await projectCategoryRepository.createCategory({ ...payload, name }, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'PROJECT_CATEGORIES', newData: category });
    return category;
  } catch (error) {
    logger.error('createCategory service failed', { error: error.message });
    throw error;
  }
};

export const getAllCategories = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 50);
    const [result, counts] = await Promise.all([
      projectCategoryRepository.listCategories({ status: query.status, limit, skip }),
      countProjectsByCategory(),
    ]);

    return {
      categories: withProjectCounts(result.items, counts),
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getAllCategories service failed', { error: error.message });
    throw error;
  }
};

export const getPublicCategories = async () => {
  try {
    const [result, counts] = await Promise.all([
      projectCategoryRepository.listActiveCategories(),
      countProjectsByCategory({ publishedOnly: true }),
    ]);

    return { categories: withProjectCounts(result.items, counts) };
  } catch (error) {
    logger.error('getPublicCategories service failed', { error: error.message });
    throw error;
  }
};

export const getCategoryById = async (categoryId) => {
  try {
    const category = await projectCategoryRepository.getCategoryById(categoryId);
    if (!category) {
      throw new AppError(PROJECT_CATEGORY_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return category;
  } catch (error) {
    logger.error('getCategoryById service failed', { error: error.message, categoryId });
    throw error;
  }
};

export const updateCategory = async (categoryId, payload, userId) => {
  try {
    const existing = await projectCategoryRepository.getCategoryById(categoryId);
    if (!existing) {
      throw new AppError(PROJECT_CATEGORY_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updates = { ...payload, updated_by: userId };
    const nextName = payload.name !== undefined ? String(payload.name).trim() : existing.name;
    const renamed = nextName.toLowerCase() !== String(existing.name).toLowerCase();

    if (payload.name !== undefined) {
      const duplicate = await projectCategoryRepository.getCategoryByName(nextName);
      if (duplicate && duplicate.category_id !== categoryId) {
        throw new AppError(
          PROJECT_CATEGORY_MESSAGES.CATEGORY_NAME_EXISTS,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        );
      }
      updates.name = nextName;
      if (payload.slug === undefined) updates.slug = slugifyCategory(nextName);
    }

    const updated = await projectCategoryRepository.updateCategory(categoryId, updates);

    // Projects reference the category by name, so a rename has to carry them
    // along or they silently fall out of the filter.
    if (renamed || nextName !== existing.name) {
      const moved = await Project.updateMany(
        projectsInCategoryFilter(existing.name),
        { $set: { category: nextName, updated_at: new Date().toISOString() } },
      );
      if (moved.modifiedCount) {
        logger.info('Re-pointed projects after category rename', {
          from: existing.name, to: nextName, count: moved.modifiedCount,
        });
      }
    }

    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'PROJECT_CATEGORIES', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateCategory service failed', { error: error.message, categoryId });
    throw error;
  }
};

export const deleteCategory = async (categoryId, userId) => {
  try {
    const existing = await projectCategoryRepository.getCategoryById(categoryId);
    if (!existing) {
      throw new AppError(PROJECT_CATEGORY_MESSAGES.CATEGORY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Refuse rather than orphan the projects still pointing at this name.
    const inUse = await Project.countDocuments(projectsInCategoryFilter(existing.name));
    if (inUse > 0) {
      throw new AppError(
        `Cannot delete "${existing.name}" — ${inUse} project${inUse > 1 ? 's are' : ' is'} still using it. Reassign them first.`,
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.BUSINESS_VALIDATION_ERROR,
      );
    }

    const deleted = await projectCategoryRepository.softDeleteCategory(categoryId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'PROJECT_CATEGORIES', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteCategory service failed', { error: error.message, categoryId });
    throw error;
  }
};

export default {
  createCategory, getAllCategories, getPublicCategories, getCategoryById, updateCategory, deleteCategory,
};
