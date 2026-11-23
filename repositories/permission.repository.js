import BaseRepository from './base.repository.js';
import Permission from '../models/permission.model.js';
import { buildPermission } from '../models/permission.model.js';
import logger from '../config/logger.js';

class PermissionRepository extends BaseRepository {
  constructor() {
    super(Permission);
  }

  async createPermission(data) {
    try {
      const permission = buildPermission(data);
      await this.createItem(permission);
      return permission;
    } catch (error) {
      logger.error('createPermission repository failed', { error: error.message });
      throw error;
    }
  }

  async getPermissionById(permissionId) {
    try {
      return await this.getItem({ permission_id: permissionId });
    } catch (error) {
      logger.error(`getPermissionById failed for ${permissionId}`, { error: error.message });
      throw error;
    }
  }

  async getPermissionByCode(code) {
    try {
      return await this.getItem({ code: code.toUpperCase() });
    } catch (error) {
      logger.error('getPermissionByCode failed', { error: error.message });
      throw error;
    }
  }

  async updatePermission(permissionId, updates) {
    try {
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.code) {
        normalizedUpdates.code = normalizedUpdates.code.toUpperCase();
      }

      return await this.updateItem(
        { permission_id: permissionId },
        { ...normalizedUpdates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updatePermission failed for ${permissionId}`, { error: error.message });
      throw error;
    }
  }

  async deletePermission(permissionId) {
    try {
      return await this.deleteItem({ permission_id: permissionId });
    } catch (error) {
      logger.error(`deletePermission failed for ${permissionId}`, { error: error.message });
      throw error;
    }
  }

  async listPermissions({ limit = 100, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      return await this.findItems({}, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listPermissions failed', { error: error.message });
      throw error;
    }
  }
}

export default new PermissionRepository();
