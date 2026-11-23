import BaseRepository from './base.repository.js';
import Upload from '../models/upload.model.js';
import { buildUpload } from '../models/upload.model.js';
import logger from '../config/logger.js';

class UploadRepository extends BaseRepository {
  constructor() {
    super(Upload);
  }

  async createUpload(data, uploadedBy = null) {
    try {
      const upload = buildUpload(data, uploadedBy);
      await this.createItem(upload);
      return upload;
    } catch (error) {
      logger.error('createUpload repository failed', { error: error.message });
      throw error;
    }
  }

  async getUploadById(uploadId) {
    try {
      return await this.getItem({ upload_id: uploadId });
    } catch (error) {
      logger.error(`getUploadById failed for ${uploadId}`, { error: error.message });
      throw error;
    }
  }

  async deleteUpload(uploadId) {
    try {
      return await this.deleteItem({ upload_id: uploadId });
    } catch (error) {
      logger.error(`deleteUpload failed for ${uploadId}`, { error: error.message });
      throw error;
    }
  }

  async listUploads({ limit = 50, lastEvaluatedKey = null, skip: skipArg = null }) {
    try {
      const skip = skipArg != null ? skipArg : this.resolveSkip(lastEvaluatedKey);
      return await this.findItems({}, { limit, skip, sort: { created_at: -1 } });
    } catch (error) {
      logger.error('listUploads failed', { error: error.message });
      throw error;
    }
  }
}

export default new UploadRepository();
