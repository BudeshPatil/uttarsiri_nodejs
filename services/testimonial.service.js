import testimonialRepository from '../repositories/testimonial.repository.js';
import { TESTIMONIAL_MESSAGES } from '../constants/testimonial.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createTestimonial = async (payload, userId) => {
  try {
    const testimonial = await testimonialRepository.createTestimonial(payload, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'TESTIMONIALS', newData: testimonial });
    return testimonial;
  } catch (error) {
    logger.error('createTestimonial service failed', { error: error.message });
    throw error;
  }
};

export const getAllTestimonials = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await testimonialRepository.listTestimonials({ ...query, limit, skip });
    return {
      testimonials: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getAllTestimonials service failed', { error: error.message });
    throw error;
  }
};

export const getPublicTestimonials = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 12);
    const result = await testimonialRepository.listTestimonials({
      ...query,
      status: 'approved',
      limit,
      skip,
    });
    return {
      testimonials: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getPublicTestimonials service failed', { error: error.message });
    throw error;
  }
};

export const getTestimonialById = async (testimonialId) => {
  try {
    const testimonial = await testimonialRepository.getTestimonialById(testimonialId);
    if (!testimonial) {
      throw new AppError(TESTIMONIAL_MESSAGES.TESTIMONIAL_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return testimonial;
  } catch (error) {
    logger.error('getTestimonialById service failed', { error: error.message, testimonialId });
    throw error;
  }
};

export const updateTestimonial = async (testimonialId, payload, userId) => {
  try {
    const existing = await testimonialRepository.getTestimonialById(testimonialId);
    if (!existing) {
      throw new AppError(TESTIMONIAL_MESSAGES.TESTIMONIAL_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const updated = await testimonialRepository.updateTestimonial(testimonialId, { ...payload, updated_by: userId });
    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'TESTIMONIALS', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateTestimonial service failed', { error: error.message, testimonialId });
    throw error;
  }
};

export const deleteTestimonial = async (testimonialId, userId) => {
  try {
    const existing = await testimonialRepository.getTestimonialById(testimonialId);
    if (!existing) {
      throw new AppError(TESTIMONIAL_MESSAGES.TESTIMONIAL_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const deleted = await testimonialRepository.softDeleteTestimonial(testimonialId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'TESTIMONIALS', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteTestimonial service failed', { error: error.message, testimonialId });
    throw error;
  }
};

export default {
  createTestimonial, getAllTestimonials, getPublicTestimonials, getTestimonialById, updateTestimonial, deleteTestimonial,
};
