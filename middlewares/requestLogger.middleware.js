import logger from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  try {
    const start = Date.now();

    logger.info('Incoming request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.on('finish', () => {
      logger.info('Request completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${Date.now() - start}ms`,
      });
    });

    return next();
  } catch (error) {
    logger.error('requestLogger middleware error', { error: error.message });
    return next();
  }
};

export default requestLogger;
