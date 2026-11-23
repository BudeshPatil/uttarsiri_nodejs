import BaseRepository from './base.repository.js';
import Gallery, { buildGallery } from '../models/gallery.model.js';
import { GALLERY_STATUS } from '../constants/gallery.constants.js';
import logger from '../config/logger.js';

class GalleryRepository extends BaseRepository {
  constructor() {
    super(Gallery);
  }

  async createGallery(data, createdBy = null) {
    try {
      const gallery = buildGallery(data, createdBy);
      await this.createItem(gallery);
      return gallery;
    } catch (error) {
      logger.error('createGallery repository failed', { error: error.message });
      throw error;
    }
  }

  async getGalleryById(galleryId) {
    try {
      const gallery = await this.getItem({ gallery_id: galleryId });
      if (gallery?.is_deleted) return null;
      return gallery;
    } catch (error) {
      logger.error(`getGalleryById failed for ${galleryId}`, { error: error.message });
      throw error;
    }
  }

  async updateGallery(galleryId, updates) {
    try {
      return await this.updateItem(
        { gallery_id: galleryId },
        { ...updates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateGallery failed for ${galleryId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteGallery(galleryId, updatedBy = null) {
    try {
      return await this.updateItem(
        { gallery_id: galleryId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteGallery failed for ${galleryId}`, { error: error.message });
      throw error;
    }
  }

  async listGalleries({ section, status, featured, limit = 50, skip = 0 }) {
    try {
      const filter = { is_deleted: { $ne: true } };
      if (section) filter.section = section;
      if (status) filter.status = status;
      if (featured === 'true' || featured === true) filter.is_featured = true;

      return await this.findItems(filter, {
        limit,
        skip,
        sort: { sort_order: 1, created_at: -1 },
      });
    } catch (error) {
      logger.error('listGalleries failed', { error: error.message });
      throw error;
    }
  }

  async listActiveGalleries({ section, limit = 100 }) {
    try {
      const filter = {
        is_deleted: { $ne: true },
        status: GALLERY_STATUS.ACTIVE,
      };
      if (section) filter.section = section;

      return await this.findItems(filter, {
        limit,
        skip: 0,
        sort: { sort_order: 1, created_at: -1 },
      });
    } catch (error) {
      logger.error('listActiveGalleries failed', { error: error.message });
      throw error;
    }
  }
}

export default new GalleryRepository();
