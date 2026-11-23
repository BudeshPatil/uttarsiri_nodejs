import BaseRepository from './base.repository.js';
import Testimonial from '../models/testimonial.model.js';
import { buildTestimonial } from '../models/testimonial.model.js';
import logger from '../config/logger.js';

class TestimonialRepository extends BaseRepository {
  constructor() {
    super(Testimonial);
  }

  async createTestimonial(data, createdBy = null) {
    try {
      const testimonial = buildTestimonial(data, createdBy);
      await this.createItem(testimonial);
      return testimonial;
    } catch (error) {
      logger.error('createTestimonial repository failed', { error: error.message });
      throw error;
    }
  }

  async getTestimonialById(testimonialId) {
    try {
      const testimonial = await this.getItem({ testimonial_id: testimonialId });
      if (testimonial?.is_deleted) return null;
      return testimonial;
    } catch (error) {
      logger.error(`getTestimonialById failed for ${testimonialId}`, { error: error.message });
      throw error;
    }
  }

  async updateTestimonial(testimonialId, updates) {
    try {
      return await this.updateItem(
        { testimonial_id: testimonialId },
        { ...updates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateTestimonial failed for ${testimonialId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteTestimonial(testimonialId, updatedBy = null) {
    try {
      return await this.updateItem(
        { testimonial_id: testimonialId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
      );
    } catch (error) {
      logger.error(`softDeleteTestimonial failed for ${testimonialId}`, { error: error.message });
      throw error;
    }
  }

  async listTestimonials({ status, rating, featured, limit = 50, skip = 0 }) {
    try {
      const filter = { is_deleted: { $ne: true } };
      if (status) filter.status = status;
      if (rating) filter.rating = Number(rating);
      if (featured === 'true' || featured === true) filter.is_featured = true;
      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listTestimonials failed', { error: error.message });
      throw error;
    }
  }
}

export default new TestimonialRepository();
