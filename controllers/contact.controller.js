import contactService from '../services/contact.service.js';
import { successResponse } from '../utils/response.util.js';
import { CONTACT_MESSAGES } from '../constants/contact.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const createContact = async (req, res, next) => {
  try {
    const contact = await contactService.createContact(req.body);
    return successResponse(res, HTTP_STATUS.CREATED, CONTACT_MESSAGES.CONTACT_CREATED, contact);
  } catch (error) {
    logger.error('createContact controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllContacts = async (req, res, next) => {
  try {
    const result = await contactService.getAllContacts(req.query);
    return successResponse(res, HTTP_STATUS.OK, CONTACT_MESSAGES.CONTACTS_FETCHED, result);
  } catch (error) {
    logger.error('getAllContacts controller failed', { error: error.message });
    return next(error);
  }
};

export const getContactById = async (req, res, next) => {
  try {
    const contact = await contactService.getContactById(req.params.id);
    return successResponse(res, HTTP_STATUS.OK, CONTACT_MESSAGES.CONTACT_FETCHED, contact);
  } catch (error) {
    logger.error('getContactById controller failed', { error: error.message });
    return next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const contact = await contactService.updateContact(
      req.params.id,
      req.body,
      req.user?.user_id,
      req.user?.name,
    );
    return successResponse(res, HTTP_STATUS.OK, CONTACT_MESSAGES.CONTACT_UPDATED, contact);
  } catch (error) {
    logger.error('updateContact controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await contactService.deleteContact(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, CONTACT_MESSAGES.CONTACT_DELETED, contact);
  } catch (error) {
    logger.error('deleteContact controller failed', { error: error.message });
    return next(error);
  }
};

export default { createContact, getAllContacts, getContactById, updateContact, deleteContact };
