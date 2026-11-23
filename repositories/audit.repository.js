import BaseRepository from './base.repository.js';
import AuditLog from '../models/auditLog.model.js';
import { buildAuditLog } from '../models/auditLog.model.js';
import logger from '../config/logger.js';

class AuditRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async createLog(data) {
    try {
      const log = buildAuditLog(data);
      await this.createItem(log);
      return log;
    } catch (error) {
      logger.error('createLog repository failed', { error: error.message });
      throw error;
    }
  }

  async getLogsByUser(userId, { limit = 20, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      return await this.findItems(
        { user_id: userId },
        { limit, skip, sort: { created_at: -1 } },
      );
    } catch (error) {
      logger.error(`getLogsByUser failed for ${userId}`, { error: error.message });
      throw error;
    }
  }

  async getLogsByModule(module, { limit = 20, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      return await this.findItems(
        { module },
        { limit, skip, sort: { created_at: -1 } },
      );
    } catch (error) {
      logger.error(`getLogsByModule failed for ${module}`, { error: error.message });
      throw error;
    }
  }

  async getLogsByAction(action, { limit = 20, lastEvaluatedKey = null, startDate = null, endDate = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = { action };

      if (startDate && endDate) {
        filter.created_at = { $gte: startDate, $lte: endDate };
      }

      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error(`getLogsByAction failed for ${action}`, { error: error.message });
      throw error;
    }
  }

  async listLogs({ limit = 20, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      return await this.findItems({}, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listLogs failed', { error: error.message });
      throw error;
    }
  }

  async countTodayByAction(action) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = today.toISOString();
      const endDate = new Date().toISOString();

      return await this.countItems({
        action,
        created_at: { $gte: startDate, $lte: endDate },
      });
    } catch (error) {
      logger.error(`countTodayByAction failed for ${action}`, { error: error.message });
      throw error;
    }
  }
}

export default new AuditRepository();
