import projectCategoryService from '../services/projectCategory.service.js';
import { successResponse } from '../utils/response.util.js';
import { PROJECT_CATEGORY_MESSAGES } from '../constants/projectCategory.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createCategory = async (req, res, next) => {
  try {
    const category = await projectCategoryService.createCategory(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, PROJECT_CATEGORY_MESSAGES.CATEGORY_CREATED, category);
  } catch (error) {
    logger.error('createCategory controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const result = await projectCategoryService.getAllCategories(req.query);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_CATEGORY_MESSAGES.CATEGORIES_FETCHED, result);
  } catch (error) {
    logger.error('getAllCategories controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicCategories = async (req, res, next) => {
  try {
    const result = await projectCategoryService.getPublicCategories();
    return successResponse(res, HTTP_STATUS.OK, PROJECT_CATEGORY_MESSAGES.CATEGORIES_FETCHED, result);
  } catch (error) {
    logger.error('getPublicCategories controller failed', { error: error.message });
    return next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await projectCategoryService.getCategoryById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_CATEGORY_MESSAGES.CATEGORY_FETCHED, category);
  } catch (error) {
    logger.error('getCategoryById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await projectCategoryService.updateCategory(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_CATEGORY_MESSAGES.CATEGORY_UPDATED, category);
  } catch (error) {
    logger.error('updateCategory controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await projectCategoryService.deleteCategory(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, PROJECT_CATEGORY_MESSAGES.CATEGORY_DELETED, category);
  } catch (error) {
    logger.error('deleteCategory controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createCategory, getAllCategories, getPublicCategories, getCategoryById, updateCategory, deleteCategory,
};
