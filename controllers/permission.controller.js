import permissionService from '../services/permission.service.js';
import { successResponse } from '../utils/response.util.js';
import { PERMISSION_MESSAGES } from '../constants/permission.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createPermission = async (req, res, next) => {
  try {
    const permission = await permissionService.createPermission(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, PERMISSION_MESSAGES.PERMISSION_CREATED, permission);
  } catch (error) {
    logger.error('createPermission controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllPermissions = async (req, res, next) => {
  try {
    const result = await permissionService.getAllPermissions(req.query);
    return successResponse(res, HTTP_STATUS.OK, PERMISSION_MESSAGES.PERMISSIONS_FETCHED, result);
  } catch (error) {
    logger.error('getAllPermissions controller failed', { error: error.message });
    return next(error);
  }
};

export const getPermissionById = async (req, res, next) => {
  try {
    const permission = await permissionService.getPermissionById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, PERMISSION_MESSAGES.PERMISSION_FETCHED, permission);
  } catch (error) {
    logger.error('getPermissionById controller failed', { error: error.message });
    return next(error);
  }
};

export const updatePermission = async (req, res, next) => {
  try {
    const permission = await permissionService.updatePermission(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PERMISSION_MESSAGES.PERMISSION_UPDATED, permission);
  } catch (error) {
    logger.error('updatePermission controller failed', { error: error.message });
    return next(error);
  }
};

export const deletePermission = async (req, res, next) => {
  try {
    const permission = await permissionService.deletePermission(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PERMISSION_MESSAGES.PERMISSION_DELETED, permission);
  } catch (error) {
    logger.error('deletePermission controller failed', { error: error.message });
    return next(error);
  }
};

export default { createPermission, getAllPermissions, getPermissionById, updatePermission, deletePermission };
