import rateLimit from 'express-rate-limit';
import appConfig from '../config/appConfig.js';
import { errorResponse } from '../utils/response.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';

export const generalRateLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'Too many requests. Please try again later.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'Too many requests. Please try again later.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
    );
  },
});

export default { generalRateLimiter, authRateLimiter };
