import jwt from 'jsonwebtoken';
import userRepository from '../repositories/user.repository.js';
import roleRepository from '../repositories/role.repository.js';
import appConfig from '../config/appConfig.js';
import logger from '../config/logger.js';
import { errorResponse } from '../utils/response.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Authorization header required', ERROR_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Bearer token required', ERROR_CODES.UNAUTHORIZED);
    }

    if (!appConfig.jwt.accessSecret) {
      logger.error('JWT access secret is not configured');
      return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Server configuration error', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    const decoded = jwt.verify(token, appConfig.jwt.accessSecret);
    const user = await userRepository.getUserById(decoded.sub);

    if (!user || user.is_deleted) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token', ERROR_CODES.UNAUTHORIZED);
    }

    let permissions = decoded.permissions || [];
    if (user.role_id) {
      const role = await roleRepository.getRoleById(user.role_id);
      permissions = role?.permissions || permissions;
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      role_code: decoded.role_code,
      permissions,
      status: user.status,
    };

    logger.info('Authentication succeeded', { user_id: user.user_id, email: user.email });
    return next();
  } catch (error) {
    logger.warn('Unauthorized access attempt', { endpoint: req.originalUrl, ip: req.ip, error: error.message });
    return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token', ERROR_CODES.UNAUTHORIZED);
  }
};

export const authorizeRole = (allowedRoles = []) => async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required', ERROR_CODES.UNAUTHORIZED);
    }

    if (!allowedRoles.length) return next();

    const userRole = req.user.role_code;
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role authorization failed', { userRole, requiredRoles: allowedRoles });
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'You do not have permission to perform this action', ERROR_CODES.FORBIDDEN);
    }

    return next();
  } catch (error) {
    logger.error('authorizeRole middleware error', { error: error.message });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

export const authorizePermission = (requiredPermissions = []) => async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required', ERROR_CODES.UNAUTHORIZED);
    }

    if (!requiredPermissions.length) return next();

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      logger.warn('Permission authorization failed', { userPermissions, requiredPermissions });
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'You do not have permission to perform this action', ERROR_CODES.FORBIDDEN);
    }

    return next();
  } catch (error) {
    logger.error('authorizePermission middleware error', { error: error.message });
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};

export default { authenticateJWT, authorizeRole, authorizePermission };
