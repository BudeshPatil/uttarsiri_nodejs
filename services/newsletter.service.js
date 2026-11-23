import newsletterRepository from '../repositories/newsletter.repository.js';
import { NEWSLETTER_MESSAGES } from '../constants/newsletter.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const getAllSubscribers = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await newsletterRepository.listSubscribers({ status: query.status, limit, skip });

    return {
      subscribers: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllSubscribers service failed', { error: error.message });
    throw error;
  }
};

export const getSubscriberById = async (subscriberId) => {
  try {
    const subscriber = await newsletterRepository.getSubscriberById(subscriberId);
    if (!subscriber) {
      throw new AppError(NEWSLETTER_MESSAGES.SUBSCRIBER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return subscriber;
  } catch (error) {
    logger.error('getSubscriberById service failed', { error: error.message, subscriberId });
    throw error;
  }
};

export const deleteSubscriber = async (subscriberId, userId) => {
  try {
    const existing = await newsletterRepository.getSubscriberById(subscriberId);
    if (!existing) {
      throw new AppError(NEWSLETTER_MESSAGES.SUBSCRIBER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await newsletterRepository.deleteSubscriber(subscriberId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'NEWSLETTER', oldData: existing });
    return existing;
  } catch (error) {
    logger.error('deleteSubscriber service failed', { error: error.message, subscriberId });
    throw error;
  }
};

export default { getAllSubscribers, getSubscriberById, deleteSubscriber };
