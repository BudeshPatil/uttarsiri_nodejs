import galleryRepository from '../repositories/gallery.repository.js';
import { GALLERY_MESSAGES } from '../constants/gallery.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createGallery = async (payload, userId) => {
  try {
    const gallery = await galleryRepository.createGallery(payload, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'GALLERIES', newData: gallery });
    return gallery;
  } catch (error) {
    logger.error('createGallery service failed', { error: error.message });
    throw error;
  }
};

export const getAllGalleries = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await galleryRepository.listGalleries({ ...query, limit, skip });
    return {
      galleries: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getAllGalleries service failed', { error: error.message });
    throw error;
  }
};

export const getPublicGalleries = async (query = {}) => {
  try {
    const result = await galleryRepository.listActiveGalleries({
      section: query.section,
      limit: Math.min(100, Math.max(1, Number(query.limit) || 100)),
    });
    return { galleries: result.items };
  } catch (error) {
    logger.error('getPublicGalleries service failed', { error: error.message });
    throw error;
  }
};

export const getGalleryById = async (galleryId) => {
  try {
    const gallery = await galleryRepository.getGalleryById(galleryId);
    if (!gallery) {
      throw new AppError(GALLERY_MESSAGES.GALLERY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return gallery;
  } catch (error) {
    logger.error('getGalleryById service failed', { error: error.message, galleryId });
    throw error;
  }
};

export const updateGallery = async (galleryId, payload, userId) => {
  try {
    const existing = await galleryRepository.getGalleryById(galleryId);
    if (!existing) {
      throw new AppError(GALLERY_MESSAGES.GALLERY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const updated = await galleryRepository.updateGallery(galleryId, { ...payload, updated_by: userId });
    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'GALLERIES', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateGallery service failed', { error: error.message, galleryId });
    throw error;
  }
};

export const deleteGallery = async (galleryId, userId) => {
  try {
    const existing = await galleryRepository.getGalleryById(galleryId);
    if (!existing) {
      throw new AppError(GALLERY_MESSAGES.GALLERY_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const deleted = await galleryRepository.softDeleteGallery(galleryId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'GALLERIES', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteGallery service failed', { error: error.message, galleryId });
    throw error;
  }
};

export default {
  createGallery, getAllGalleries, getPublicGalleries, getGalleryById, updateGallery, deleteGallery,
};
