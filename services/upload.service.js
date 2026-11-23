import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRepository from '../repositories/upload.repository.js';
import appConfig from '../config/appConfig.js';
import { UPLOAD_MESSAGES } from '../constants/upload.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.join(__dirname, '../', appConfig.uploadDir);

export const createUpload = async (file, userId) => {
  try {
    if (!file) {
      throw new AppError(UPLOAD_MESSAGES.NO_FILE, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const url = `/public/uploads/${file.filename}`;
    const upload = await uploadRepository.createUpload({
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      url,
      path: file.path,
    }, userId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'UPLOADS', newData: upload });
    return upload;
  } catch (error) {
    logger.error('createUpload service failed', { error: error.message });
    throw error;
  }
};

export const getAllUploads = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await uploadRepository.listUploads({ limit, skip });

    return {
      uploads: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllUploads service failed', { error: error.message });
    throw error;
  }
};

export const deleteUpload = async (uploadId, userId) => {
  try {
    const existing = await uploadRepository.getUploadById(uploadId);
    if (!existing) {
      throw new AppError(UPLOAD_MESSAGES.UPLOAD_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (existing.path && fs.existsSync(existing.path)) {
      fs.unlinkSync(existing.path);
    }

    await uploadRepository.deleteUpload(uploadId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'UPLOADS', oldData: existing });
    return existing;
  } catch (error) {
    logger.error('deleteUpload service failed', { error: error.message, uploadId });
    throw error;
  }
};

export const ensureUploadDir = () => {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
  return uploadRoot;
};

export default { createUpload, getAllUploads, deleteUpload, ensureUploadDir };
