import BaseRepository from './base.repository.js';
import CmsPage from '../models/cmsPage.model.js';
import { buildCmsPage } from '../models/cmsPage.model.js';
import logger from '../config/logger.js';

class CmsRepository extends BaseRepository {
  constructor() {
    super(CmsPage);
  }

  async createPage(data, createdBy = null) {
    try {
      const page = buildCmsPage(data, createdBy);
      await this.createItem(page);
      return page;
    } catch (error) {
      logger.error('createPage repository failed', { error: error.message });
      throw error;
    }
  }

  async getPageById(pageId) {
    try {
      const page = await this.getItem({ page_id: pageId });
      if (page?.is_deleted) return null;
      return page;
    } catch (error) {
      logger.error(`getPageById failed for ${pageId}`, { error: error.message });
      throw error;
    }
  }

  async getPageBySlug(slug) {
    try {
      return await this.getItem({
        slug: slug.toLowerCase(),
        is_deleted: { $ne: true },
      });
    } catch (error) {
      logger.error('getPageBySlug failed', { error: error.message });
      throw error;
    }
  }

  async updatePage(pageId, updates) {
    try {
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.slug) {
        normalizedUpdates.slug = normalizedUpdates.slug.toLowerCase();
      }

      return await this.updateItem(
        { page_id: pageId },
        { ...normalizedUpdates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updatePage failed for ${pageId}`, { error: error.message });
      throw error;
    }
  }

  async softDeletePage(pageId, updatedBy = null) {
    try {
      return await this.updateItem(
        { page_id: pageId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeletePage failed for ${pageId}`, { error: error.message });
      throw error;
    }
  }

  async listPages({ status, limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = { is_deleted: { $ne: true } };

      if (status) filter.status = status;

      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listPages failed', { error: error.message });
      throw error;
    }
  }
}

export default new CmsRepository();
