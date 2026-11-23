import roleRepository from '../repositories/role.repository.js';
import { ROLE_MESSAGES } from '../constants/role.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createRole = async (payload, userId) => {
  try {
    const existing = await roleRepository.getRoleByCode(payload.role_code);
    if (existing) {
      throw new AppError(ROLE_MESSAGES.ROLE_CODE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const role = await roleRepository.createRole(payload);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: 'ROLES',
      newData: role,
    });

    return role;
  } catch (error) {
    logger.error('createRole service failed', { error: error.message });
    throw error;
  }
};

export const getAllRoles = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await roleRepository.listRoles({ limit, skip });

    return {
      roles: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllRoles service failed', { error: error.message });
    throw error;
  }
};

export const getRoleById = async (roleId) => {
  try {
    const role = await roleRepository.getRoleById(roleId);
    if (!role) {
      throw new AppError(ROLE_MESSAGES.ROLE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return role;
  } catch (error) {
    logger.error('getRoleById service failed', { error: error.message, roleId });
    throw error;
  }
};

export const updateRole = async (roleId, payload, userId) => {
  try {
    const existing = await roleRepository.getRoleById(roleId);
    if (!existing) {
      throw new AppError(ROLE_MESSAGES.ROLE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (payload.role_code && payload.role_code !== existing.role_code) {
      const duplicate = await roleRepository.getRoleByCode(payload.role_code);
      if (duplicate) {
        throw new AppError(ROLE_MESSAGES.ROLE_CODE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const updated = await roleRepository.updateRole(roleId, payload);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'ROLES',
      oldData: existing,
      newData: updated,
    });

    return updated;
  } catch (error) {
    logger.error('updateRole service failed', { error: error.message, roleId });
    throw error;
  }
};

export const deleteRole = async (roleId, userId) => {
  try {
    const existing = await roleRepository.getRoleById(roleId);
    if (!existing) {
      throw new AppError(ROLE_MESSAGES.ROLE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await roleRepository.deleteRole(roleId);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: 'ROLES',
      oldData: existing,
    });

    return existing;
  } catch (error) {
    logger.error('deleteRole service failed', { error: error.message, roleId });
    throw error;
  }
};

export default { createRole, getAllRoles, getRoleById, updateRole, deleteRole };
