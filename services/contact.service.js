import contactRepository from '../repositories/contact.repository.js';
import { CONTACT_MESSAGES } from '../constants/contact.constants.js';
import { AUDIT_ACTIONS, SETTING_KEYS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import { sendEmail } from './email.service.js';
import settingsRepository from '../repositories/settings.repository.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { generateId } from '../utils/uuid.util.js';
import logger from '../config/logger.js';

const notifyNewInquiry = async (contact) => {
  try {
    const receiverSetting = await settingsRepository.getSetting(SETTING_KEYS.RECEIVER_EMAIL);
    const receiverEmail = receiverSetting?.value;
    if (!receiverEmail) return;

    await sendEmail({
      to: receiverEmail,
      subject: `New Inquiry from ${contact.name}`,
      html: `
        <h2>New Website Inquiry</h2>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
        <p><strong>Service:</strong> ${contact.service_interest || 'General'}</p>
        <p><strong>Source:</strong> ${contact.source}</p>
        <p><strong>Message:</strong></p>
        <p>${contact.message || 'No message'}</p>
      `,
      text: `New inquiry from ${contact.name} (${contact.email})`,
    });
  } catch (error) {
    logger.error('notifyNewInquiry failed', { error: error.message });
  }
};

export const createContact = async (payload) => {
  try {
    const contact = await contactRepository.createContact(payload);
    await notifyNewInquiry(contact);
    return contact;
  } catch (error) {
    logger.error('createContact service failed', { error: error.message });
    throw error;
  }
};

export const getAllContacts = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await contactRepository.listContacts({
      status: query.status,
      lead_status: query.lead_status,
      assigned_to: query.assigned_to,
      source: query.source,
      limit,
      skip,
    });

    return {
      contacts: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllContacts service failed', { error: error.message });
    throw error;
  }
};

export const getContactById = async (contactId) => {
  try {
    const contact = await contactRepository.getContactById(contactId);
    if (!contact) {
      throw new AppError(CONTACT_MESSAGES.CONTACT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return contact;
  } catch (error) {
    logger.error('getContactById service failed', { error: error.message, contactId });
    throw error;
  }
};

export const updateContact = async (contactId, payload, userId, userName = '') => {
  try {
    const existing = await contactRepository.getContactById(contactId);
    if (!existing) {
      throw new AppError(CONTACT_MESSAGES.CONTACT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const updates = { ...payload };
    if (payload.note?.content) {
      const newNote = {
        note_id: generateId(),
        content: payload.note.content,
        created_by: userId || '',
        created_by_name: userName || '',
        created_at: new Date().toISOString(),
      };
      updates.notes = [...(existing.notes || []), newNote];
      delete updates.note;
    }

    const updated = await contactRepository.updateContact(contactId, updates);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'CONTACTS', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updateContact service failed', { error: error.message, contactId });
    throw error;
  }
};

export const deleteContact = async (contactId, userId) => {
  try {
    const existing = await contactRepository.getContactById(contactId);
    if (!existing) {
      throw new AppError(CONTACT_MESSAGES.CONTACT_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await contactRepository.deleteContact(contactId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'CONTACTS', oldData: existing });
    return existing;
  } catch (error) {
    logger.error('deleteContact service failed', { error: error.message, contactId });
    throw error;
  }
};

export default { createContact, getAllContacts, getContactById, updateContact, deleteContact };
