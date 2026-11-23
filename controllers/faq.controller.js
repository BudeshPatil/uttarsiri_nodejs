import faqService from '../services/faq.service.js';
import { successResponse } from '../utils/response.util.js';
import { FAQ_MESSAGES } from '../constants/faq.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createFaq = async (req, res, next) => {
  try {
    const faq = await faqService.createFaq(req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, FAQ_MESSAGES.FAQ_CREATED, faq);
  } catch (error) {
    logger.error('createFaq controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllFaqs = async (req, res, next) => {
  try {
    const result = await faqService.getAllFaqs(req.query);
    return successResponse(res, HTTP_STATUS.OK, FAQ_MESSAGES.FAQS_FETCHED, result);
  } catch (error) {
    logger.error('getAllFaqs controller failed', { error: error.message });
    return next(error);
  }
};

export const getPublicFaqs = async (req, res, next) => {
  try {
    const result = await faqService.getPublicFaqs(req.query);
    return successResponse(res, HTTP_STATUS.OK, FAQ_MESSAGES.FAQS_FETCHED, result);
  } catch (error) {
    logger.error('getPublicFaqs controller failed', { error: error.message });
    return next(error);
  }
};

export const getFaqById = async (req, res, next) => {
  try {
    const faq = await faqService.getFaqById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, FAQ_MESSAGES.FAQ_FETCHED, faq);
  } catch (error) {
    logger.error('getFaqById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateFaq = async (req, res, next) => {
  try {
    const faq = await faqService.updateFaq(req.params.id, req.body, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, FAQ_MESSAGES.FAQ_UPDATED, faq);
  } catch (error) {
    logger.error('updateFaq controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteFaq = async (req, res, next) => {
  try {
    const faq = await faqService.deleteFaq(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, FAQ_MESSAGES.FAQ_DELETED, faq);
  } catch (error) {
    logger.error('deleteFaq controller failed', { error: error.message });
    return next(error);
  }
};

export default { createFaq, getAllFaqs, getPublicFaqs, getFaqById, updateFaq, deleteFaq };
