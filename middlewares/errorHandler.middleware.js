import { ZodError } from 'zod';
import logger from '../config/logger.js';
import AppError from '../utils/appError.util.js';
import { errorResponse } from '../utils/response.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import appConfig from '../config/appConfig.js';

export const errorHandler = (err, req, res, next) => {
  try {
    if (err instanceof AppError) {
      logger.error('Application error', {
        message: err.message,
        errorCode: err.errorCode,
        statusCode: err.statusCode,
      });
      return errorResponse(res, err.statusCode, err.message, err.errorCode);
    }

    if (err instanceof ZodError) {
      const message = err.errors.map((e) => e.message).join(', ');
      logger.warn('Validation error', { message, path: req.originalUrl });
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.VALIDATION_ERROR);
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      logger.warn('JWT error', { message: err.message });
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired token', ERROR_CODES.UNAUTHORIZED);
    }

    if (err.name === 'ConditionalCheckFailedException') {
      logger.warn('Database conditional check failed', { message: err.message });
      return errorResponse(res, HTTP_STATUS.CONFLICT, 'Resource conflict', ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    if (err.name === 'CastError') {
      logger.warn('Invalid resource identifier', { message: err.message });
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Resource not found', ERROR_CODES.NOT_FOUND);
    }

    if (err.code === 11000) {
      logger.warn('MongoDB duplicate key', { message: err.message });
      return errorResponse(res, HTTP_STATUS.CONFLICT, 'Resource conflict', ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    if (err.name === 'ValidationError') {
      logger.warn('MongoDB validation error', { message: err.message });
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, err.message, ERROR_CODES.VALIDATION_ERROR);
    }

    logger.error('Unhandled error', {
      message: err.message,
      stack: appConfig.nodeEnv !== 'production' ? err.stack : undefined,
      path: req.originalUrl,
    });

    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_SERVER_ERROR);
  } catch (handlerError) {
    logger.error('Error handler failed', { error: handlerError.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error_code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
};

export const notFoundHandler = (req, res) => {
  return errorResponse(res, HTTP_STATUS.NOT_FOUND, `Route ${req.originalUrl} not found`, ERROR_CODES.NOT_FOUND);
};

export default { errorHandler, notFoundHandler };
