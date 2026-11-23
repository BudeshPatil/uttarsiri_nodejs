import permissionRepository from '../repositories/permission.repository.js';
import { PERMISSION_MESSAGES } from '../constants/permission.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createPermission = async (payload, userId) => {
  try {
    const existing = await permissionRepository.getPermissionByCode(payload.code);
    if (existing) {
      throw new AppError(PERMISSION_MESSAGES.PERMISSION_CODE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const permission = await permissionRepository.createPermission(payload);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: 'PERMISSIONS',
      newData: permission,
    });

    return permission;
  } catch (error) {
    logger.error('createPermission service failed', { error: error.message });
    throw error;
  }
};

export const getAllPermissions = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await permissionRepository.listPermissions({ limit, skip });

    return {
      permissions: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllPermissions service failed', { error: error.message });
    throw error;
  }
};

export const getPermissionById = async (permissionId) => {
  try {
    const permission = await permissionRepository.getPermissionById(permissionId);
    if (!permission) {
      throw new AppError(PERMISSION_MESSAGES.PERMISSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return permission;
  } catch (error) {
    logger.error('getPermissionById service failed', { error: error.message, permissionId });
    throw error;
  }
};

export const updatePermission = async (permissionId, payload, userId) => {
  try {
    const existing = await permissionRepository.getPermissionById(permissionId);
    if (!existing) {
      throw new AppError(PERMISSION_MESSAGES.PERMISSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (payload.code && payload.code.toUpperCase() !== existing.code) {
      const duplicate = await permissionRepository.getPermissionByCode(payload.code);
      if (duplicate) {
        throw new AppError(PERMISSION_MESSAGES.PERMISSION_CODE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const updated = await permissionRepository.updatePermission(permissionId, payload);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'PERMISSIONS',
      oldData: existing,
      newData: updated,
    });

    return updated;
  } catch (error) {
    logger.error('updatePermission service failed', { error: error.message, permissionId });
    throw error;
  }
};

export const deletePermission = async (permissionId, userId) => {
  try {
    const existing = await permissionRepository.getPermissionById(permissionId);
    if (!existing) {
      throw new AppError(PERMISSION_MESSAGES.PERMISSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await permissionRepository.deletePermission(permissionId);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: 'PERMISSIONS',
      oldData: existing,
    });

    return existing;
  } catch (error) {
    logger.error('deletePermission service failed', { error: error.message, permissionId });
    throw error;
  }
};

export default { createPermission, getAllPermissions, getPermissionById, updatePermission, deletePermission };
