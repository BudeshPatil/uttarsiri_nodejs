import userService from '../services/user.service.js';
import { successResponse } from '../utils/response.util.js';
import { USER_MESSAGES } from '../constants/user.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, USER_MESSAGES.USER_CREATED, user);
  } catch (error) {
    logger.error('createUser controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers(req.query);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USERS_FETCHED, result);
  } catch (error) {
    logger.error('getAllUsers controller failed', { error: error.message });
    return next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_FETCHED, user);
  } catch (error) {
    logger.error('getUserById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_UPDATED, user);
  } catch (error) {
    logger.error('updateUser controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_DELETED, user);
  } catch (error) {
    logger.error('deleteUser controller failed', { error: error.message });
    return next(error);
  }
};

export const approveUser = async (req, res, next) => {
  try {
    const user = await userService.approveUser(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_APPROVED, user);
  } catch (error) {
    logger.error('approveUser controller failed', { error: error.message });
    return next(error);
  }
};

export const rejectUser = async (req, res, next) => {
  try {
    const user = await userService.rejectUser(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_REJECTED, user);
  } catch (error) {
    logger.error('rejectUser controller failed', { error: error.message });
    return next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const user = await userService.blockUser(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_BLOCKED, user);
  } catch (error) {
    logger.error('blockUser controller failed', { error: error.message });
    return next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const user = await userService.unblockUser(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, USER_MESSAGES.USER_UNBLOCKED, user);
  } catch (error) {
    logger.error('unblockUser controller failed', { error: error.message });
    return next(error);
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
