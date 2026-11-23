import testimonialService from '../services/testimonial.service.js';
import { successResponse } from '../utils/response.util.js';
import { TESTIMONIAL_MESSAGES } from '../constants/testimonial.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.createTestimonial(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, TESTIMONIAL_MESSAGES.TESTIMONIAL_CREATED, testimonial);
  } catch (error) {
    logger.error('createTestimonial controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllTestimonials = async (req, res, next) => {
  try {
    const result = await testimonialService.getAllTestimonials(req.query);
    return successResponse(res, HTTP_STATUS.OK, TESTIMONIAL_MESSAGES.TESTIMONIALS_FETCHED, result);
  } catch (error) {
    logger.error('getAllTestimonials controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicTestimonials = async (req, res, next) => {
  try {
    const result = await testimonialService.getPublicTestimonials(req.query);
    return successResponse(res, HTTP_STATUS.OK, TESTIMONIAL_MESSAGES.TESTIMONIALS_FETCHED, result);
  } catch (error) {
    logger.error('getPublicTestimonials controller failed', { error: error.message });
    return next(error);
  }
};

export const getTestimonialById = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.getTestimonialById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, TESTIMONIAL_MESSAGES.TESTIMONIAL_FETCHED, testimonial);
  } catch (error) {
    logger.error('getTestimonialById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.updateTestimonial(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, TESTIMONIAL_MESSAGES.TESTIMONIAL_UPDATED, testimonial);
  } catch (error) {
    logger.error('updateTestimonial controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await testimonialService.deleteTestimonial(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, TESTIMONIAL_MESSAGES.TESTIMONIAL_DELETED, testimonial);
  } catch (error) {
    logger.error('deleteTestimonial controller failed', { error: error.message });
    return next(error);
  }
};

export default {
  createTestimonial, getAllTestimonials, getPublicTestimonials, getTestimonialById, updateTestimonial, deleteTestimonial,
};
