import BaseRepository from './base.repository.js';
import Category, { buildCategory } from '../models/category.model.js';
import { CATEGORY_STATUS } from '../constants/category.constants.js';

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async createCategory(data, createdBy = null) {
    const category = buildCategory(data, createdBy);
    await this.createItem(category);
    return category;
  }

  async getCategoryById(categoryId) {
    const category = await this.getItem({ category_id: categoryId });
    if (category?.is_deleted) return null;
    return category;
  }

  async getCategoryBySlug(slug) {
    const category = await this.getItem({ category_slug: slug, is_deleted: { $ne: true } });
    return category;
  }

  async updateCategory(categoryId, updates) {
    return this.updateItem(
      { category_id: categoryId },
      { ...updates, updated_at: new Date().toISOString() },
    );
  }

  async softDeleteCategory(categoryId, updatedBy = null) {
    return this.updateItem(
      { category_id: categoryId },
      { is_deleted: true, updated_at: new Date().toISOString(), updated_by: updatedBy },
    );
  }

  async listCategories({
    status,
    parent_category_id,
    search,
    include_tree,
    limit = 50,
    skip = 0,
  } = {}) {
    const filter = { is_deleted: { $ne: true } };

    if (status) filter.status = status;

    if (parent_category_id === 'null' || parent_category_id === 'root') {
      filter.parent_category_id = null;
    } else if (parent_category_id) {
      filter.parent_category_id = parent_category_id;
    }

    if (search) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const term = new RegExp(escaped, 'i');
      filter.$or = [
        { name_en: term },
        { name_kn: term },
        { name_hi: term },
        { category_slug: term },
      ];
    }

    return this.findItems(filter, {
      limit,
      skip,
      sort: { display_order: 1, name_en: 1 },
    });
  }

  async listActiveCategories({ limit = 200 } = {}) {
    return this.findItems(
      { is_deleted: { $ne: true }, status: CATEGORY_STATUS.ACTIVE },
      { limit, skip: 0, sort: { display_order: 1, name_en: 1 } },
    );
  }

  async getCategoriesByIds(ids = []) {
    if (!ids.length) return [];
    const result = await this.findItems(
      { category_id: { $in: ids }, is_deleted: { $ne: true } },
      { limit: ids.length, skip: 0 },
    );
    return result.items;
  }

  async countChildren(parentCategoryId) {
    return this.countItems({
      parent_category_id: parentCategoryId,
      is_deleted: { $ne: true },
    });
  }
}

export default new CategoryRepository();
