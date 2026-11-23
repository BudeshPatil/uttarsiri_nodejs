import galleryService from '../services/gallery.service.js';
import { successResponse } from '../utils/response.util.js';
import { GALLERY_MESSAGES } from '../constants/gallery.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createGallery = async (req, res, next) => {
  try {
    const gallery = await galleryService.createGallery(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, GALLERY_MESSAGES.GALLERY_CREATED, gallery);
  } catch (error) {
    logger.error('createGallery controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllGalleries = async (req, res, next) => {
  try {
    const result = await galleryService.getAllGalleries(req.query);
    return successResponse(res, HTTP_STATUS.OK, GALLERY_MESSAGES.GALLERIES_FETCHED, result);
  } catch (error) {
    logger.error('getAllGalleries controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicGalleries = async (req, res, next) => {
  try {
    const result = await galleryService.getPublicGalleries(req.query);
    return successResponse(res, HTTP_STATUS.OK, GALLERY_MESSAGES.GALLERIES_FETCHED, result);
  } catch (error) {
    logger.error('getPublicGalleries controller failed', { error: error.message });
    return next(error);
  }
};

export const getGalleryById = async (req, res, next) => {
  try {
    const gallery = await galleryService.getGalleryById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, GALLERY_MESSAGES.GALLERY_FETCHED, gallery);
  } catch (error) {
    logger.error('getGalleryById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateGallery = async (req, res, next) => {
  try {
    const gallery = await galleryService.updateGallery(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, GALLERY_MESSAGES.GALLERY_UPDATED, gallery);
  } catch (error) {
    logger.error('updateGallery controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteGallery = async (req, res, next) => {
  try {
    const gallery = await galleryService.deleteGallery(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, GALLERY_MESSAGES.GALLERY_DELETED, gallery);
  } catch (error) {
    logger.error('deleteGallery controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createGallery, getAllGalleries, getPublicGalleries, getGalleryById, updateGallery, deleteGallery,
};
