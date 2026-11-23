import BaseRepository from './base.repository.js';
import Role from '../models/role.model.js';
import { buildRole } from '../models/role.model.js';
import logger from '../config/logger.js';

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async createRole(data) {
    try {
      const role = buildRole(data);
      await this.createItem(role);
      return role;
    } catch (error) {
      logger.error('createRole repository failed', { error: error.message });
      throw error;
    }
  }

  async getRoleById(roleId) {
    try {
      return await this.getItem({ role_id: roleId });
    } catch (error) {
      logger.error(`getRoleById failed for ${roleId}`, { error: error.message });
      throw error;
    }
  }

  async getRoleByCode(roleCode) {
    try {
      return await this.getItem({ role_code: roleCode.toUpperCase() });
    } catch (error) {
      logger.error('getRoleByCode failed', { error: error.message });
      throw error;
    }
  }

  async updateRole(roleId, updates) {
    try {
      return await this.updateItem(
        { role_id: roleId },
        { ...updates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateRole failed for ${roleId}`, { error: error.message });
      throw error;
    }
  }

  async deleteRole(roleId) {
    try {
      return await this.deleteItem({ role_id: roleId });
    } catch (error) {
      logger.error(`deleteRole failed for ${roleId}`, { error: error.message });
      throw error;
    }
  }

  async listRoles({ limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      return await this.findItems({}, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listRoles failed', { error: error.message });
      throw error;
    }
  }

  async countRoles() {
    try {
      return await this.countItems({});
    } catch (error) {
      logger.error('countRoles failed', { error: error.message });
      throw error;
    }
  }
}

export default new RoleRepository();
