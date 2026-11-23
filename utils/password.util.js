import bcrypt from 'bcrypt';
import appConfig from '../config/appConfig.js';
import logger from '../config/logger.js';

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, appConfig.bcryptSaltRounds);
  } catch (error) {
    logger.error('Password hashing failed', { error: error.message });
    throw error;
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Password comparison failed', { error: error.message });
    throw error;
  }
};

export default { hashPassword, comparePassword };
