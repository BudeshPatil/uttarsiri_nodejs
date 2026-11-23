import BaseRepository from './base.repository.js';
import Contact from '../models/contact.model.js';
import { buildContact } from '../models/contact.model.js';
import logger from '../config/logger.js';

class ContactRepository extends BaseRepository {
  constructor() {
    super(Contact);
  }

  async createContact(data) {
    try {
      const contact = buildContact(data);
      await this.createItem(contact);
      return contact;
    } catch (error) {
      logger.error('createContact repository failed', { error: error.message });
      throw error;
    }
  }

  async getContactById(contactId) {
    try {
      return await this.getItem({ contact_id: contactId });
    } catch (error) {
      logger.error(`getContactById failed for ${contactId}`, { error: error.message });
      throw error;
    }
  }

  async updateContact(contactId, updates) {
    try {
      return await this.updateItem(
        { contact_id: contactId },
        { ...updates, updated_at: new Date().toISOString() },
      );
    } catch (error) {
      logger.error(`updateContact failed for ${contactId}`, { error: error.message });
      throw error;
    }
  }

  async deleteContact(contactId) {
    try {
      return await this.deleteItem({ contact_id: contactId });
    } catch (error) {
      logger.error(`deleteContact failed for ${contactId}`, { error: error.message });
      throw error;
    }
  }

  async listContacts({ status, lead_status, assigned_to, source, limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      const filter = {};
      if (status) filter.status = status;
      if (lead_status) filter.lead_status = lead_status;
      if (assigned_to) filter.assigned_to = assigned_to;
      if (source) filter.source = source;
      return await this.findItems(filter, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listContacts failed', { error: error.message });
      throw error;
    }
  }
}

export default new ContactRepository();
