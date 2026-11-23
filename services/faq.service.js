import faqRepository from '../repositories/faq.repository.js';
import { FAQ_MESSAGES } from '../constants/faq.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createFaq = async (payload, userId) => {
  try {
    const faq = await faqRepository.createFaq(payload, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'FAQS', newData: faq });
    return faq;
  } catch (error) {
    logger.error('createFaq service failed', { error: error.message });
    throw error;
  }
};

export const getAllFaqs = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await faqRepository.listFaqs({ ...query, limit, skip });
    return {
      faqs: result.items,
      pagination: buildPaginationMeta({ page, limit, count: result.items.length, total: result.total }),
    };
  } catch (error) {
    logger.error('getAllFaqs service failed', { error: error.message });
    throw error;
  }
};

export const getPublicFaqs = async (query = {}) => {
  try {
    const result = await faqRepository.listActiveFaqs({
      limit: Math.min(100, Math.max(1, Number(query.limit) || 100)),
    });
    return { faqs: result.items };
  } catch (error) {
    logger.error('getPublicFaqs service failed', { error: error.message });
    throw error;
  }
};

export const getFaqById = async (faqId) => {
  try {
    const faq = await faqRepository.getFaqById(faqId);
    if (!faq) {
      throw new AppError(FAQ_MESSAGES.FAQ_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return faq;
  } catch (error) {
    logger.error('getFaqById service failed', { error: error.message, faqId });
    throw error;
  }
};

export const updateFaq = async (faqId, payload, userId) => {
  try {
    const existing = await faqRepository.getFaqById(faqId);
    if (!existing) {
      throw new AppError(FAQ_MESSAGES.FAQ_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const updated = await faqRepository.updateFaq(faqId, { ...payload, updated_by: userId });
    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'FAQS', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateFaq service failed', { error: error.message, faqId });
    throw error;
  }
};

export const deleteFaq = async (faqId, userId) => {
  try {
    const existing = await faqRepository.getFaqById(faqId);
    if (!existing) {
      throw new AppError(FAQ_MESSAGES.FAQ_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    const deleted = await faqRepository.softDeleteFaq(faqId, userId);
    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'FAQS', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deleteFaq service failed', { error: error.message, faqId });
    throw error;
  }
};

export default { createFaq, getAllFaqs, getPublicFaqs, getFaqById, updateFaq, deleteFaq };
