import BaseRepository from './base.repository.js';
import Service from '../models/service.model.js';
import { buildService } from '../models/service.model.js';
import logger from '../config/logger.js';

class ServiceRepository extends BaseRepository {
  constructor() {
    super(Service);
  }

  async createService(data, createdBy = null) {
    try {
      const service = buildService(data, createdBy);
      await this.createItem(service);
      return service;
    } catch (error) {
      logger.error('createService repository failed', { error: error.message });
      throw error;
    }
  }

  async getServiceById(serviceId) {
    try {
      const service = await this.getItem({ service_id: serviceId });
      if (service?.is_deleted) return null;
      return service;
    } catch (error) {
      logger.error(`getServiceById failed for ${serviceId}`, { error: error.message });
      throw error;
    }
  }

  async getServiceBySlug(slug) {
    try {
      return await this.getItem({
        slug: slug.toLowerCase(),
        is_deleted: { $ne: true },
      });
    } catch (error) {
      logger.error('getServiceBySlug failed', { error: error.message });
      throw error;
    }
  }

  async updateService(serviceId, updates) {
    try {
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.slug) {
        normalizedUpdates.slug = normalizedUpdates.slug.toLowerCase();
      }
      return await this.updateItem(
        { service_id: serviceId },
        { ...normalizedUpdates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateService failed for ${serviceId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteService(serviceId, updatedBy = null) {
    try {
      return await this.updateItem(
        { service_id: serviceId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteService failed for ${serviceId}`, { error: error.message });
      throw error;
    }
  }

  async listServices({ status, category, featured, search, limit = 50, skip = 0 }) {
    try {
      const filter = { is_deleted: { $ne: true } };
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (featured === 'true' || featured === true) filter.is_featured = true;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { short_description: { $regex: search, $options: 'i' } },
        ];
      }
      return await this.findItems(filter, { limit, skip, sort: { sort_order: 1, created_at: -1 } });
    } catch (error) {
      logger.error('listServices failed', { error: error.message });
      throw error;
    }
  }
}

export default new ServiceRepository();
