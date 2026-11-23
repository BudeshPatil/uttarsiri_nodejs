import BaseRepository from './base.repository.js';
import Banner from '../models/banner.model.js';
import { buildBanner } from '../models/banner.model.js';
import { BANNER_STATUS } from '../constants/banner.constants.js';
import logger from '../config/logger.js';

class BannerRepository extends BaseRepository {
  constructor() {
    super(Banner);
  }

  async createBanner(data, createdBy = null) {
    try {
      const banner = buildBanner(data, createdBy);
      await this.createItem(banner);
      return banner;
    } catch (error) {
      logger.error('createBanner repository failed', { error: error.message });
      throw error;
    }
  }

  async getBannerById(bannerId) {
    try {
      const banner = await this.getItem({ banner_id: bannerId });
      if (banner?.is_deleted) return null;
      return banner;
    } catch (error) {
      logger.error(`getBannerById failed for ${bannerId}`, { error: error.message });
      throw error;
    }
  }

  async updateBanner(bannerId, updates) {
    try {
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.sort_order !== undefined) {
        normalizedUpdates.sort_order = Number(normalizedUpdates.sort_order) || 0;
      }

      return await this.updateItem(
        { banner_id: bannerId },
        { ...normalizedUpdates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateBanner failed for ${bannerId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteBanner(bannerId, updatedBy = null) {
    try {
      return await this.updateItem(
        { banner_id: bannerId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteBanner failed for ${bannerId}`, { error: error.message });
      throw error;
    }
  }

  async listBanners({ status, limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = { is_deleted: { $ne: true } };

      if (status) filter.status = status;

      return await this.findItems(filter, {
        limit,
        skip,
        sort: { sort_order: 1, created_at: -1 },
      });
    } catch (error) {
      logger.error('listBanners failed', { error: error.message });
      throw error;
    }
  }

  async listActiveBanners() {
    try {
      const now = new Date().toISOString();
      const filter = {
        is_deleted: { $ne: true },
        status: BANNER_STATUS.ACTIVE,
        $and: [
          {
            $or: [{ starts_at: null }, { starts_at: '' }, { starts_at: { $lte: now } }],
          },
          {
            $or: [{ ends_at: null }, { ends_at: '' }, { ends_at: { $gte: now } }],
          },
        ],
      };

      const result = await this.findItems(filter, {
        limit: 50,
        skip: 0,
        sort: { sort_order: 1, created_at: -1 },
      });

      return result.items;
    } catch (error) {
      logger.error('listActiveBanners failed', { error: error.message });
      throw error;
    }
  }
}

export default new BannerRepository();
