import BaseRepository from './base.repository.js';
import User from '../models/user.model.js';
import { buildUser } from '../models/user.model.js';
import logger from '../config/logger.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async createUser(data, createdBy = null) {
    try {
      const user = buildUser(data, createdBy);
      await this.createItem(user);
      return user;
    } catch (error) {
      logger.error('createUser repository failed', { error: error.message });
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      return await this.getItem({ user_id: userId });
    } catch (error) {
      logger.error(`getUserById failed for ${userId}`, { error: error.message });
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      return await this.getItem({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('getUserByEmail failed', { error: error.message });
      throw error;
    }
  }

  async getUserByPhone(phone) {
    try {
      return await this.getItem({ phone });
    } catch (error) {
      logger.error('getUserByPhone failed', { error: error.message });
      throw error;
    }
  }

  async updateUser(userId, updates) {
    try {
      return await this.updateItem(
        { user_id: userId },
        { ...updates, updated_at: new Date().toISOString() },
        { extraFilter: { is_deleted: false } },
      );
    } catch (error) {
      logger.error(`updateUser failed for ${userId}`, { error: error.message });
      throw error;
    }
  }

  async softDeleteUser(userId, updatedBy = null) {
    try {
      return await this.updateItem(
        { user_id: userId },
        {
          is_deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
        { extraFilter: { is_deleted: false } },
      );
    } catch (error) {
      logger.error(`softDeleteUser failed for ${userId}`, { error: error.message });
      throw error;
    }
  }

  async listUsers({ status, roleId, limit = 20, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = { is_deleted: false };

      if (status) filter.status = status;
      if (roleId) filter.role_id = roleId;

      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listUsers failed', { error: error.message });
      throw error;
    }
  }

  async countByStatus(status) {
    try {
      return await this.countItems({ status, is_deleted: false });
    } catch (error) {
      logger.error(`countByStatus failed for ${status}`, { error: error.message });
      throw error;
    }
  }

  async countActiveUsers() {
    try {
      return await this.countByStatus('approved');
    } catch (error) {
      logger.error('countActiveUsers failed', { error: error.message });
      throw error;
    }
  }
}

export default new UserRepository();
