import seoService from '../services/seo.service.js';
import { successResponse } from '../utils/response.util.js';
import { SEO_MESSAGES } from '../constants/settings.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const getSeo = async (req, res, next) => {
  try {
    const seo = await seoService.getSeoSettings();
    return successResponse(res, HTTP_STATUS.OK, SEO_MESSAGES.SEO_FETCHED, seo);
  } catch (error) {
    logger.error('getSeo controller failed', { error: error.message });
    return next(error);
  }
};

export const updateSeo = async (req, res, next) => {
  try {
    const seo = await seoService.updateSeoSettings(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, SEO_MESSAGES.SEO_UPDATED, seo);
  } catch (error) {
    logger.error('updateSeo controller failed', { error: error.message });
    return next(error);
  }
};

export const generateSitemap = async (req, res, next) => {
  try {
    const result = await seoService.generateSitemap(req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, result.message, { path: result.path });
  } catch (error) {
    logger.error('generateSitemap controller failed', { error: error.message });
    return next(error);
  }
};

export const generateRobots = async (req, res, next) => {
  try {
    const result = await seoService.generateRobots(req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, result.message, { path: result.path });
  } catch (error) {
    logger.error('generateRobots controller failed', { error: error.message });
    return next(error);
  }
};

export default { getSeo, updateSeo, generateSitemap, generateRobots };
