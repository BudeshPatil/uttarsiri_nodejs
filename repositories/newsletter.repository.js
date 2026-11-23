import BaseRepository from './base.repository.js';
import NewsletterSubscriber from '../models/newsletter.model.js';
import { buildSubscriber } from '../models/newsletter.model.js';
import logger from '../config/logger.js';

class NewsletterRepository extends BaseRepository {
  constructor() {
    super(NewsletterSubscriber);
  }

  async createSubscriber(data) {
    try {
      const subscriber = buildSubscriber(data);
      await this.createItem(subscriber);
      return subscriber;
    } catch (error) {
      logger.error('createSubscriber repository failed', { error: error.message });
      throw error;
    }
  }

  async getSubscriberById(subscriberId) {
    try {
      return await this.getItem({ subscriber_id: subscriberId });
    } catch (error) {
      logger.error(`getSubscriberById failed for ${subscriberId}`, { error: error.message });
      throw error;
    }
  }

  async getSubscriberByEmail(email) {
    try {
      return await this.getItem({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('getSubscriberByEmail failed', { error: error.message });
      throw error;
    }
  }

  async deleteSubscriber(subscriberId) {
    try {
      return await this.deleteItem({ subscriber_id: subscriberId });
    } catch (error) {
      logger.error(`deleteSubscriber failed for ${subscriberId}`, { error: error.message });
      throw error;
    }
  }

  async listSubscribers({ status, limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = {};
      if (status) filter.status = status;
      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listSubscribers failed', { error: error.message });
      throw error;
    }
  }
}

export default new NewsletterRepository();
