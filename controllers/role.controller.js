import roleService from '../services/role.service.js';
import { successResponse } from '../utils/response.util.js';
import { ROLE_MESSAGES } from '../constants/role.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, ROLE_MESSAGES.ROLE_CREATED, role);
  } catch (error) {
    logger.error('createRole controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllRoles = async (req, res, next) => {
  try {
    const result = await roleService.getAllRoles(req.query);
    return successResponse(res, HTTP_STATUS.OK, ROLE_MESSAGES.ROLES_FETCHED, result);
  } catch (error) {
    logger.error('getAllRoles controller failed', { error: error.message });
    return next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, ROLE_MESSAGES.ROLE_FETCHED, role);
  } catch (error) {
    logger.error('getRoleById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, ROLE_MESSAGES.ROLE_UPDATED, role);
  } catch (error) {
    logger.error('updateRole controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    const role = await roleService.deleteRole(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, ROLE_MESSAGES.ROLE_DELETED, role);
  } catch (error) {
    logger.error('deleteRole controller failed', { error: error.message });
    return next(error);
  }
};

export default { createRole, getAllRoles, getRoleById, updateRole, deleteRole };
