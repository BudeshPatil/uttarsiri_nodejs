import cmsService from '../services/cms.service.js';
import { successResponse } from '../utils/response.util.js';
import { CMS_MESSAGES } from '../constants/cms.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createPage = async (req, res, next) => {
  try {
    const page = await cmsService.createPage(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, CMS_MESSAGES.PAGE_CREATED, page);
  } catch (error) {
    logger.error('createPage controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllPages = async (req, res, next) => {
  try {
    const result = await cmsService.getAllPages(req.query);
    return successResponse(res, HTTP_STATUS.OK, CMS_MESSAGES.PAGES_FETCHED, result);
  } catch (error) {
    logger.error('getAllPages controller failed', { error: error.message });
    return next(error);
  }
};

export const getPageById = async (req, res, next) => {
  try {
    const page = await cmsService.getPageById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, CMS_MESSAGES.PAGE_FETCHED, page);
  } catch (error) {
    logger.error('getPageById controller failed', { error: error.message });
    return next(error);
  }
};

export const updatePage = async (req, res, next) => {
  try {
    const page = await cmsService.updatePage(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, CMS_MESSAGES.PAGE_UPDATED, page);
  } catch (error) {
    logger.error('updatePage controller failed', { error: error.message });
    return next(error);
  }
};

export const deletePage = async (req, res, next) => {
  try {
    const page = await cmsService.deletePage(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, CMS_MESSAGES.PAGE_DELETED, page);
  } catch (error) {
    logger.error('deletePage controller failed', { error: error.message });
    return next(error);
  }
};

export default { createPage, getAllPages, getPageById, updatePage, deletePage };
