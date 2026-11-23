import serviceRepository from '../repositories/service.repository.js';
import { SERVICE_MESSAGES } from '../constants/service.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createService = async (payload, userId) => {
  try {
    const existing = await serviceRepository.getServiceBySlug(payload.slug);
    if (existing) {
      throw new AppError(SERVICE_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    const service = await serviceRepository.createService(payload, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'SERVICES', newData: service });
    return service;
  } catch (error) {
    logger.error('createService service failed', { error: error.message });
    throw error;
  }
};

export const getAllServices = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await serviceRepository.listServices({ ...query, limit, skip });
    return {
      services: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getAllServices service failed', { error: error.message });
    throw error;
  }
};

export const getPublicServices = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 12);
    const result = await serviceRepository.listServices({
      ...query,
      status: 'published',
      limit,
      skip,
    });
    return {
      services: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getPublicServices service failed', { error: error.message });
    throw error;
  }
};

export const getServiceById = async (serviceId) => {
  try {
    const service = await serviceRepository.getServiceById(serviceId);
    if (!service) {
      throw new AppError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return service;
  } catch (error) {
    logger.error('getServiceById service failed', { error: error.message, serviceId });
    throw error;
  }
};

export const getServiceBySlug = async (slug, publicOnly = false) => {
  try {
    const service = await serviceRepository.getServiceBySlug(slug);
    if (!service || (publicOnly && service.status !== 'published')) {
      throw new AppError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return service;
  } catch (error) {
    logger.error('getServiceBySlug service failed', { error: error.message, slug });
    throw error;
  }
};

export const updateService = async (serviceId, payload, userId) => {
  try {
    const existing = await serviceRepository.getServiceById(serviceId);
    if (!existing) {
      throw new AppError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (payload.slug && payload.slug.toLowerCase() !== existing.slug) {
      const duplicate = await serviceRepository.getServiceBySlug(payload.slug);
      if (duplicate && duplicate.service_id !== serviceId) {
        throw new AppError(SERVICE_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }
    const updated = await serviceRepository.updateService(serviceId, { ...payload, updated_by: userId });
    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'SERVICES', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateService service failed', { error: error.message, serviceId });
    throw error;
  }
};

export const deleteService = async (serviceId, userId) => {
  try {
    const existing = await serviceRepository.getServiceById(serviceId);
    if (!existing) {
      throw new AppError(SERVICE_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const deleted = await serviceRepository.softDeleteService(serviceId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'SERVICES', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteService service failed', { error: error.message, serviceId });
    throw error;
  }
};

export default {
  createService, getAllServices, getPublicServices, getServiceById, getServiceBySlug, updateService, deleteService,
};
