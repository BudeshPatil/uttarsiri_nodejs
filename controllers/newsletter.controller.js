import newsletterService from '../services/newsletter.service.js';
import { successResponse } from '../utils/response.util.js';
import { NEWSLETTER_MESSAGES } from '../constants/newsletter.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const getAllSubscribers = async (req, res, next) => {
  try {
    const result = await newsletterService.getAllSubscribers(req.query);
    return successResponse(res, HTTP_STATUS.OK, NEWSLETTER_MESSAGES.SUBSCRIBERS_FETCHED, result);
  } catch (error) {
    logger.error('getAllSubscribers controller failed', { error: error.message });
    return next(error);
  }
};

export const getSubscriberById = async (req, res, next) => {
  try {
    const subscriber = await newsletterService.getSubscriberById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, NEWSLETTER_MESSAGES.SUBSCRIBER_FETCHED, subscriber);
  } catch (error) {
    logger.error('getSubscriberById controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteSubscriber = async (req, res, next) => {
  try {
    const subscriber = await newsletterService.deleteSubscriber(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, NEWSLETTER_MESSAGES.SUBSCRIBER_DELETED, subscriber);
  } catch (error) {
    logger.error('deleteSubscriber controller failed', { error: error.message });
    return next(error);
  }
};

export default { getAllSubscribers, getSubscriberById, deleteSubscriber };
