import userRepository from '../repositories/user.repository.js';
import roleRepository from '../repositories/role.repository.js';
import { hashPassword } from '../utils/password.util.js';
import { sanitizeUser } from '../models/user.model.js';
import { USER_STATUS, USER_MESSAGES } from '../constants/user.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createUser = async (payload, createdBy) => {
  try {
    const existingEmail = await userRepository.getUserByEmail(payload.email);
    if (existingEmail && !existingEmail.is_deleted) {
      throw new AppError(USER_MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    if (payload.phone) {
      const existingPhone = await userRepository.getUserByPhone(payload.phone);
      if (existingPhone && !existingPhone.is_deleted) {
        throw new AppError(USER_MESSAGES.PHONE_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    if (payload.role_id) {
      const role = await roleRepository.getRoleById(payload.role_id);
      if (!role) {
        throw new AppError('Role not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
      }
    }

    const hashedPassword = payload.password ? await hashPassword(payload.password) : undefined;
    const user = await userRepository.createUser(
      {
        ...payload,
        ...(hashedPassword && { password: hashedPassword }),
        status: payload.status || USER_STATUS.APPROVED,
      },
      createdBy,
    );

    await createAuditLog({
      userId: createdBy || user.user_id,
      action: AUDIT_ACTIONS.CREATE,
      module: 'USERS',
      newData: sanitizeUser(user),
    });

    return sanitizeUser(user);
  } catch (error) {
    logger.error('createUser service failed', { error: error.message });
    throw error;
  }
};

export const getAllUsers = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);

    const result = await userRepository.listUsers({
      status: query.status,
      roleId: query.role_id,
      limit,
      skip,
    });

    const users = result.items.map(sanitizeUser);

    return {
      users,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: users.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllUsers service failed', { error: error.message });
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const user = await userRepository.getUserById(userId);
    if (!user || user.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return sanitizeUser(user);
  } catch (error) {
    logger.error('getUserById service failed', { error: error.message, userId });
    throw error;
  }
};

export const updateUser = async (userId, payload, updatedBy) => {
  try {
    const existing = await userRepository.getUserById(userId);
    if (!existing || existing.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updates = { ...payload, updated_by: updatedBy };
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const updated = await userRepository.updateUser(userId, updates);

    await createAuditLog({
      userId: updatedBy,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'USERS',
      oldData: sanitizeUser(existing),
      newData: sanitizeUser(updated),
    });

    return sanitizeUser(updated);
  } catch (error) {
    logger.error('updateUser service failed', { error: error.message, userId });
    throw error;
  }
};

export const deleteUser = async (userId, deletedBy) => {
  try {
    const existing = await userRepository.getUserById(userId);
    if (!existing || existing.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const deleted = await userRepository.softDeleteUser(userId, deletedBy);

    await createAuditLog({
      userId: deletedBy,
      action: AUDIT_ACTIONS.DELETE,
      module: 'USERS',
      oldData: sanitizeUser(existing),
    });

    return sanitizeUser(deleted);
  } catch (error) {
    logger.error('deleteUser service failed', { error: error.message, userId });
    throw error;
  }
};

export const approveUser = async (userId, updatedBy) => {
  try {
    const user = await userRepository.getUserById(userId);
    if (!user || user.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (user.status === USER_STATUS.APPROVED) {
      throw new AppError(USER_MESSAGES.ALREADY_APPROVED, HTTP_STATUS.UNPROCESSABLE, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }

    const updated = await userRepository.updateUser(userId, {
      status: USER_STATUS.APPROVED,
      updated_by: updatedBy,
    });

    await createAuditLog({
      userId: updatedBy,
      action: AUDIT_ACTIONS.APPROVE,
      module: 'USERS',
      oldData: sanitizeUser(user),
      newData: sanitizeUser(updated),
    });

    return sanitizeUser(updated);
  } catch (error) {
    logger.error('approveUser service failed', { error: error.message, userId });
    throw error;
  }
};

export const rejectUser = async (userId, updatedBy) => {
  try {
    const user = await userRepository.getUserById(userId);
    if (!user || user.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (user.status === USER_STATUS.REJECTED) {
      throw new AppError(USER_MESSAGES.ALREADY_REJECTED, HTTP_STATUS.UNPROCESSABLE, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }

    const updated = await userRepository.updateUser(userId, {
      status: USER_STATUS.REJECTED,
      updated_by: updatedBy,
    });

    await createAuditLog({
      userId: updatedBy,
      action: AUDIT_ACTIONS.REJECT,
      module: 'USERS',
      oldData: sanitizeUser(user),
      newData: sanitizeUser(updated),
    });

    return sanitizeUser(updated);
  } catch (error) {
    logger.error('rejectUser service failed', { error: error.message, userId });
    throw error;
  }
};

export const blockUser = async (userId, updatedBy) => {
  try {
    const user = await userRepository.getUserById(userId);
    if (!user || user.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(USER_MESSAGES.ALREADY_BLOCKED, HTTP_STATUS.UNPROCESSABLE, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }

    const updated = await userRepository.updateUser(userId, {
      status: USER_STATUS.BLOCKED,
      updated_by: updatedBy,
    });

    await createAuditLog({
      userId: updatedBy,
      action: AUDIT_ACTIONS.BLOCK,
      module: 'USERS',
      oldData: sanitizeUser(user),
      newData: sanitizeUser(updated),
    });

    return sanitizeUser(updated);
  } catch (error) {
    logger.error('blockUser service failed', { error: error.message, userId });
    throw error;
  }
};

export const unblockUser = async (userId, updatedBy) => {
  try {
    const user = await userRepository.getUserById(userId);
    if (!user || user.is_deleted) {
      throw new AppError(USER_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (user.status !== USER_STATUS.BLOCKED) {
      throw new AppError(USER_MESSAGES.NOT_BLOCKED, HTTP_STATUS.UNPROCESSABLE, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }

    const updated = await userRepository.updateUser(userId, {
      status: USER_STATUS.APPROVED,
      updated_by: updatedBy,
    });

    await createAuditLog({
      userId: updatedBy,
      action: AUDIT_ACTIONS.UNBLOCK,
      module: 'USERS',
      oldData: sanitizeUser(user),
      newData: sanitizeUser(updated),
    });

    return sanitizeUser(updated);
  } catch (error) {
    logger.error('unblockUser service failed', { error: error.message, userId });
    throw error;
  }
};

export default {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
};
