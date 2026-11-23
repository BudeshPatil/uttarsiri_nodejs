import BaseRepository from './base.repository.js';
import Faq, { buildFaq } from '../models/faq.model.js';
import { FAQ_STATUS } from '../constants/faq.constants.js';
import logger from '../config/logger.js';

class FaqRepository extends BaseRepository {
  constructor() {
    super(Faq);
  }

  async createFaq(data, createdBy = null) {
    try {
      const faq = buildFaq(data, createdBy);
      await this.createItem(faq);
      return faq;
    } catch (error) {
      logger.error('createFaq repository failed', { error: error.message });
      throw error;
    }
  }

  async getFaqById(faqId) {
    try {
      const faq = await this.getItem({ faq_id: faqId });
      if (faq?.is_deleted) return null;
      return faq;
    } catch (error) {
      logger.error(`getFaqById failed for ${faqId}`, { error: error.message });
      throw error;
    }
  }

  async updateFaq(faqId, updates) {
    try {
      return await this.updateItem(
        { faq_id: faqId },
        { ...updates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateFaq failed for ${faqId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteFaq(faqId, updatedBy = null) {
    try {
      return await this.updateItem(
        { faq_id: faqId },
        { is_deleted: true, updated_at: new Date().toISOString(), updated_by: updatedBy },
      );
    } catch (error) {
      logger.error(`softDeleteFaq failed for ${faqId}`, { error: error.message });
      throw error;
    }
  }

  async listFaqs({ status, featured, search, limit = 50, skip = 0 }) {
    try {
      const filter = { is_deleted: { $ne: true } };
      if (status) filter.status = status;
      if (featured === 'true' || featured === true) filter.is_featured = true;
      if (search) {
        const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const term = new RegExp(escaped, 'i');
        filter.$or = [{ question: term }, { answer: term }];
      }

      return await this.findItems(filter, {
        limit,
        skip,
        sort: { sort_order: 1, created_at: -1 },
      });
    } catch (error) {
      logger.error('listFaqs failed', { error: error.message });
      throw error;
    }
  }

  async listActiveFaqs({ limit = 100 } = {}) {
    try {
      return await this.findItems(
        { is_deleted: { $ne: true }, status: FAQ_STATUS.ACTIVE },
        { limit, skip: 0, sort: { sort_order: 1, created_at: -1 } },
      );
    } catch (error) {
      logger.error('listActiveFaqs failed', { error: error.message });
      throw error;
    }
  }
}

export default new FaqRepository();
