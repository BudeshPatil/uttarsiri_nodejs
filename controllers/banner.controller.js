import bannerService from '../services/banner.service.js';
import { successResponse } from '../utils/response.util.js';
import { BANNER_MESSAGES } from '../constants/banner.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, BANNER_MESSAGES.BANNER_CREATED, banner);
  } catch (error) {
    logger.error('createBanner controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getAllBanners(req.query);
    return successResponse(res, HTTP_STATUS.OK, BANNER_MESSAGES.BANNERS_FETCHED, result);
  } catch (error) {
    logger.error('getAllBanners controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getPublicBanners();
    return successResponse(res, HTTP_STATUS.OK, BANNER_MESSAGES.BANNERS_FETCHED, result);
  } catch (error) {
    logger.error('getPublicBanners controller failed', { error: error.message });
    return next(error);
  }
};

export const getBannerById = async (req, res, next) => {
  try {
    const banner = await bannerService.getBannerById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, BANNER_MESSAGES.BANNER_FETCHED, banner);
  } catch (error) {
    logger.error('getBannerById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.updateBanner(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, BANNER_MESSAGES.BANNER_UPDATED, banner);
  } catch (error) {
    logger.error('updateBanner controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.deleteBanner(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, BANNER_MESSAGES.BANNER_DELETED, banner);
  } catch (error) {
    logger.error('deleteBanner controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createBanner,
  getAllBanners,
  getPublicBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};
