import BaseRepository from './base.repository.js';
import ProjectCategory, { buildProjectCategory } from '../models/projectCategory.model.js';
import { PROJECT_CATEGORY_STATUS } from '../constants/projectCategory.constants.js';
import logger from '../config/logger.js';

class ProjectCategoryRepository extends BaseRepository {
  constructor() {
    super(ProjectCategory);
  }

  async createCategory(data, createdBy = null) {
    try {
      const category = buildProjectCategory(data, createdBy);
      await this.createItem(category);
      return category;
    } catch (error) {
      logger.error('createCategory repository failed', { error: error.message });
      throw error;
    }
  }

  async getCategoryById(categoryId) {
    try {
      const category = await this.getItem({ category_id: categoryId });
      if (category?.is_deleted) return null;
      return category;
    } catch (error) {
      logger.error(`getCategoryById failed for ${categoryId}`, { error: error.message });
      throw error;
    }
  }

  /** Case-insensitive so "Interior" and "interior" cannot both be created. */
  async getCategoryByName(name) {
    try {
      const category = await this.getItem({
        name: new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        is_deleted: { $ne: true },
      });
      return category || null;
    } catch (error) {
      logger.error('getCategoryByName failed', { error: error.message, name });
      throw error;
    }
  }

  async updateCategory(categoryId, updates) {
    try {
      return await this.updateItem(
        { category_id: categoryId },
        { ...updates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateCategory failed for ${categoryId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteCategory(categoryId, updatedBy = null) {
    try {
      return await this.updateItem(
        { category_id: categoryId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteCategory failed for ${categoryId}`, { error: error.message });
      throw error;
    }
  }

  async listCategories({ status, limit = 100, skip = 0 }) {
    try {
      const filter = { is_deleted: { $ne: true } };
      if (status) filter.status = status;

      return await this.findItems(filter, {
        limit,
        skip,
        sort: { sort_order: 1, name: 1 },
      });
    } catch (error) {
      logger.error('listCategories failed', { error: error.message });
      throw error;
    }
  }

  async listActiveCategories({ limit = 100 } = {}) {
    try {
      return await this.findItems(
        { is_deleted: { $ne: true }, status: PROJECT_CATEGORY_STATUS.ACTIVE },
        { limit, skip: 0, sort: { sort_order: 1, name: 1 } },
      );
    } catch (error) {
      logger.error('listActiveCategories failed', { error: error.message });
      throw error;
    }
  }
}

export default new ProjectCategoryRepository();
