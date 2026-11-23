import settingsService from '../services/settings.service.js';
import { successResponse } from '../utils/response.util.js';
import { SETTINGS_MESSAGES } from '../constants/settings.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    return successResponse(res, HTTP_STATUS.OK, SETTINGS_MESSAGES.SETTINGS_FETCHED, settings);
  } catch (error) {
    logger.error('getSettings controller failed', { error: error.message });
    return next(error);
  }
};

export const getBranding = async (req, res, next) => {
  try {
    const branding = await settingsService.getBranding();
    return successResponse(res, HTTP_STATUS.OK, SETTINGS_MESSAGES.BRANDING_FETCHED, branding);
  } catch (error) {
    logger.error('getBranding controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getPublicSettings();
    return successResponse(res, HTTP_STATUS.OK, SETTINGS_MESSAGES.SETTINGS_FETCHED, settings);
  } catch (error) {
    logger.error('getPublicSettings controller failed', { error: error.message });
    return next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, SETTINGS_MESSAGES.SETTINGS_UPDATED, settings);
  } catch (error) {
    logger.error('updateSettings controller failed', { error: error.message });
    return next(error);
  }
};

export default { getSettings, getBranding, getPublicSettings, updateSettings };
