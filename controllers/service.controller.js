import serviceService from '../services/service.service.js';
import { successResponse } from '../utils/response.util.js';
import { SERVICE_MESSAGES } from '../constants/service.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createService = async (req, res, next) => {
  try {
    const service = await serviceService.createService(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, SERVICE_MESSAGES.SERVICE_CREATED, service);
  } catch (error) {
    logger.error('createService controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllServices = async (req, res, next) => {
  try {
    const result = await serviceService.getAllServices(req.query);
    return successResponse(res, HTTP_STATUS.OK, SERVICE_MESSAGES.SERVICES_FETCHED, result);
  } catch (error) {
    logger.error('getAllServices controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicServices = async (req, res, next) => {
  try {
    const result = await serviceService.getPublicServices(req.query);
    return successResponse(res, HTTP_STATUS.OK, SERVICE_MESSAGES.SERVICES_FETCHED, result);
  } catch (error) {
    logger.error('getPublicServices controller failed', { error: error.message });
    return next(error);
  }
};

export const getServiceById = async (req, res, next) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, SERVICE_MESSAGES.SERVICE_FETCHED, service);
  } catch (error) {
    logger.error('getServiceById controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicServiceBySlug = async (req, res, next) => {
  try {
    const service = await serviceService.getServiceBySlug(req.params.slug, true);
    return successResponse(res, HTTP_STATUS.OK, SERVICE_MESSAGES.SERVICE_FETCHED, service);
  } catch (error) {
    logger.error('getPublicServiceBySlug controller failed', { error: error.message });
    return next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, SERVICE_MESSAGES.SERVICE_UPDATED, service);
  } catch (error) {
    logger.error('updateService controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await serviceService.deleteService(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, SERVICE_MESSAGES.SERVICE_DELETED, service);
  } catch (error) {
    logger.error('deleteService controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createService, getAllServices, getPublicServices, getServiceById, getPublicServiceBySlug, updateService, deleteService,
};
