import jwt from 'jsonwebtoken';
import appConfig from '../config/appConfig.js';
import logger from '../config/logger.js';

export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, appConfig.jwt.accessSecret, {
      expiresIn: appConfig.jwt.accessExpiry,
    });
  } catch (error) {
    logger.error('generateAccessToken failed', { error: error.message });
    throw error;
  }
};

export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, appConfig.jwt.refreshSecret, {
      expiresIn: appConfig.jwt.refreshExpiry,
    });
  } catch (error) {
    logger.error('generateRefreshToken failed', { error: error.message });
    throw error;
  }
};

export const generateResetToken = (payload) => {
  try {
    return jwt.sign(payload, appConfig.jwt.accessSecret, {
      expiresIn: appConfig.jwt.resetExpiry,
    });
  } catch (error) {
    logger.error('generateResetToken failed', { error: error.message });
    throw error;
  }
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwt.accessSecret);
  } catch (error) {
    logger.error('verifyAccessToken failed', { error: error.message });
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, appConfig.jwt.refreshSecret);
  } catch (error) {
    logger.error('verifyRefreshToken failed', { error: error.message });
    throw error;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
};
