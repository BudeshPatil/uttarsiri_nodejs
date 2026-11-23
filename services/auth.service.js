import userRepository from '../repositories/user.repository.js';
import roleRepository from '../repositories/role.repository.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt.util.js';
import { sanitizeUser } from '../models/user.model.js';
import { USER_STATUS, AUTH_MESSAGES } from '../constants/user.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import { sendPasswordResetEmail } from './email.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

const assertUniqueCredentials = async ({ email, phone }) => {
  const existingEmail = await userRepository.getUserByEmail(email);
  if (existingEmail && !existingEmail.is_deleted) {
    throw new AppError('Email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }

  const existingPhone = await userRepository.getUserByPhone(phone);
  if (existingPhone && !existingPhone.is_deleted) {
    throw new AppError('Phone number already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
  }
};

const issueTokensForUser = async (user) => {
  const role = user.role_id ? await roleRepository.getRoleById(user.role_id) : null;
  const tokenPayload = {
    sub: user.user_id,
    email: user.email,
    role_id: user.role_id,
    role_code: role?.role_code || null,
    permissions: role?.permissions || [],
  };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ sub: user.user_id });
  await userRepository.updateUser(user.user_id, {
    last_login: new Date().toISOString(),
    refresh_token: refreshToken,
  });
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

export const register = async (payload) => {
  try {
    await assertUniqueCredentials(payload);

    const hashedPassword = await hashPassword(payload.password);
    // Public register never accepts role_id — staff accounts are created by admins/seed.
    const user = await userRepository.createUser({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      preferred_language: payload.preferred_language || 'en',
      status: USER_STATUS.PENDING,
      role_id: null,
    });

    await createAuditLog({
      userId: user.user_id,
      action: AUDIT_ACTIONS.REGISTER,
      module: 'AUTH',
      newData: sanitizeUser(user),
    });

    return sanitizeUser(user);
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new AppError('Email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    logger.error('register failed', { error: error.message });
    throw error;
  }
};

export const registerCustomer = async (payload) => {
  try {
    await assertUniqueCredentials(payload);

    let customerRole = await roleRepository.getRoleByCode('CUSTOMER');
    if (!customerRole) {
      customerRole = await roleRepository.createRole({
        role_name: 'Customer',
        role_code: 'CUSTOMER',
        description: 'Storefront customer',
        permissions: [],
        is_active: true,
      });
    }

    const hashedPassword = await hashPassword(payload.password);
    const user = await userRepository.createUser({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: hashedPassword,
      preferred_language: payload.preferred_language || 'en',
      role_id: customerRole.role_id,
      status: USER_STATUS.APPROVED,
    });

    await createAuditLog({
      userId: user.user_id,
      action: AUDIT_ACTIONS.REGISTER,
      module: 'AUTH',
      newData: sanitizeUser(user),
    });

    return issueTokensForUser(user);
  } catch (error) {
    logger.error('registerCustomer failed', { error: error.message });
    throw error;
  }
};

export const getProfile = async (userId) => {
  const user = await userRepository.getUserById(userId);
  if (!user || user.is_deleted) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return sanitizeUser(user);
};

export const updateProfile = async (userId, payload) => {
  const user = await userRepository.getUserById(userId);
  if (!user || user.is_deleted) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (payload.phone && payload.phone !== user.phone) {
    const existingPhone = await userRepository.getUserByPhone(payload.phone);
    if (existingPhone && existingPhone.user_id !== userId && !existingPhone.is_deleted) {
      throw new AppError('Phone number already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.preferred_language !== undefined) updates.preferred_language = payload.preferred_language;
  if (payload.profile_image !== undefined) updates.profile_image = payload.profile_image;

  const updated = await userRepository.updateUser(userId, updates);
  return sanitizeUser(updated);
};

export const login = async ({ email, password }) => {
  try {
    const user = await userRepository.getUserByEmail(email);
    if (!user || user.is_deleted) {
      throw new AppError(AUTH_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    if (user.status === USER_STATUS.PENDING) {
      throw new AppError(AUTH_MESSAGES.ACCOUNT_PENDING, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    if (user.status === USER_STATUS.REJECTED) {
      throw new AppError(AUTH_MESSAGES.ACCOUNT_REJECTED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(AUTH_MESSAGES.ACCOUNT_BLOCKED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError(AUTH_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    await createAuditLog({
      userId: user.user_id,
      action: AUDIT_ACTIONS.LOGIN,
      module: 'AUTH',
    });

    logger.info('User login successful', { user_id: user.user_id, email: user.email });

    return issueTokensForUser(user);
  } catch (error) {
    logger.error('login failed', { error: error.message, email });
    throw error;
  }
};

export const logout = async (userId) => {
  try {
    await userRepository.updateUser(userId, { refresh_token: null });

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.LOGOUT,
      module: 'AUTH',
    });

    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
  } catch (error) {
    logger.error('logout failed', { error: error.message, userId });
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const user = await userRepository.getUserByEmail(email);
    if (!user || user.is_deleted) {
      return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SENT };
    }

    const resetToken = generateResetToken({ sub: user.user_id, email: user.email });
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString();

    await userRepository.updateUser(user.user_id, {
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry,
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      logger.warn('Failed to send reset email', { error: emailError.message });
    }

    return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SENT };
  } catch (error) {
    logger.error('forgotPassword failed', { error: error.message, email });
    throw error;
  }
};

export const resetPassword = async ({ token, password }) => {
  try {
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new AppError(AUTH_MESSAGES.INVALID_RESET_TOKEN, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await userRepository.getUserById(decoded.sub);
    if (!user || user.is_deleted) {
      throw new AppError(AUTH_MESSAGES.INVALID_RESET_TOKEN, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (user.reset_token !== token) {
      throw new AppError(AUTH_MESSAGES.INVALID_RESET_TOKEN, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      throw new AppError(AUTH_MESSAGES.INVALID_RESET_TOKEN, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const hashedPassword = await hashPassword(password);
    await userRepository.updateUser(user.user_id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null,
    });

    return { message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
  } catch (error) {
    logger.error('resetPassword failed', { error: error.message });
    throw error;
  }
};

export const refresh = async ({ refreshToken }) => {
  try {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    const user = await userRepository.getUserById(decoded.sub);
    if (!user || user.is_deleted) {
      throw new AppError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    if (user.refresh_token !== refreshToken) {
      throw new AppError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    if (user.status === USER_STATUS.PENDING) {
      throw new AppError(AUTH_MESSAGES.ACCOUNT_PENDING, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    if (user.status === USER_STATUS.REJECTED) {
      throw new AppError(AUTH_MESSAGES.ACCOUNT_REJECTED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(AUTH_MESSAGES.ACCOUNT_BLOCKED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }

    const role = user.role_id ? await roleRepository.getRoleById(user.role_id) : null;

    const tokenPayload = {
      sub: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role_code: role?.role_code || null,
      permissions: role?.permissions || [],
    };

    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ sub: user.user_id });

    await userRepository.updateUser(user.user_id, {
      refresh_token: newRefreshToken,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error('refresh failed', { error: error.message });
    throw error;
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
