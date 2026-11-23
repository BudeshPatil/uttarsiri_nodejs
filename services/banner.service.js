import bannerRepository from '../repositories/banner.repository.js';
import { BANNER_MESSAGES } from '../constants/banner.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createBanner = async (payload, userId) => {
  try {
    const banner = await bannerRepository.createBanner(payload, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'BANNERS', newData: banner });
    return banner;
  } catch (error) {
    logger.error('createBanner service failed', { error: error.message });
    throw error;
  }
};

export const getAllBanners = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await bannerRepository.listBanners({
      status: query.status,
      limit,
      skip,
    });

    return {
      banners: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
        lastEvaluatedKey: result.lastEvaluatedKey,
      }),
    };
  } catch (error) {
    logger.error('getAllBanners service failed', { error: error.message });
    throw error;
  }
};

export const getPublicBanners = async () => {
  try {
    const banners = await bannerRepository.listActiveBanners();
    return { banners };
  } catch (error) {
    logger.error('getPublicBanners service failed', { error: error.message });
    throw error;
  }
};

export const getBannerById = async (bannerId) => {
  try {
    const banner = await bannerRepository.getBannerById(bannerId);
    if (!banner) {
      throw new AppError(BANNER_MESSAGES.BANNER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return banner;
  } catch (error) {
    logger.error('getBannerById service failed', { error: error.message, bannerId });
    throw error;
  }
};

export const updateBanner = async (bannerId, payload, userId) => {
  try {
    const existing = await bannerRepository.getBannerById(bannerId);
    if (!existing) {
      throw new AppError(BANNER_MESSAGES.BANNER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updated = await bannerRepository.updateBanner(bannerId, {
      ...payload,
      updated_by: userId,
    });

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'BANNERS',
      oldData: existing,
      newData: updated,
    });

    return updated;
  } catch (error) {
    logger.error('updateBanner service failed', { error: error.message, bannerId });
    throw error;
  }
};

export const deleteBanner = async (bannerId, userId) => {
  try {
    const existing = await bannerRepository.getBannerById(bannerId);
    if (!existing) {
      throw new AppError(BANNER_MESSAGES.BANNER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const deleted = await bannerRepository.softDeleteBanner(bannerId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'BANNERS', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteBanner service failed', { error: error.message, bannerId });
    throw error;
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
