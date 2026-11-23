import authService from '../services/auth.service.js';
import { successResponse } from '../utils/response.util.js';
import { AUTH_MESSAGES } from '../constants/user.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, AUTH_MESSAGES.REGISTER_SUCCESS, user);
  } catch (error) {
    logger.error('register controller failed', { error: error.message });
    return next(error);
  }
};

export const registerCustomer = async (req, res, next) => {
  try {
    const result = await authService.registerCustomer(req.body);
    return successResponse(
      res,
      HTTP_STATUS.CREATED,
      AUTH_MESSAGES.CUSTOMER_REGISTER_SUCCESS,
      result,
    );
  } catch (error) {
    logger.error('registerCustomer controller failed', { error: error.message });
    return next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.user_id);
    return successResponse(res, HTTP_STATUS.OK, AUTH_MESSAGES.PROFILE_FETCHED, { user });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.user_id, req.body);
    return successResponse(res, HTTP_STATUS.OK, AUTH_MESSAGES.PROFILE_UPDATED, { user });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, HTTP_STATUS.OK, AUTH_MESSAGES.LOGIN_SUCCESS, result);
  } catch (error) {
    logger.error('login controller failed', { error: error.message });
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req.user.user_id);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    logger.error('logout controller failed', { error: error.message });
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    logger.error('forgotPassword controller failed', { error: error.message });
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return successResponse(res, HTTP_STATUS.OK, result.message);
  } catch (error) {
    logger.error('resetPassword controller failed', { error: error.message });
    return next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body);
    return successResponse(res, HTTP_STATUS.OK, AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS, result);
  } catch (error) {
    logger.error('refresh controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  register,
  registerCustomer,
  getProfile,
  updateProfile,
  login,
  logout,
  forgotPassword,
  resetPassword,
  refresh,
};
