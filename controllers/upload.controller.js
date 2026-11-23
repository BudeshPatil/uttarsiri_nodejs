import uploadService from '../services/upload.service.js';
import { successResponse } from '../utils/response.util.js';
import { UPLOAD_MESSAGES } from '../constants/upload.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const uploadFile = async (req, res, next) => {
  try {
    const upload = await uploadService.createUpload(req.file, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.CREATED, UPLOAD_MESSAGES.UPLOAD_CREATED, upload);
  } catch (error) {
    logger.error('uploadFile controller failed', { error: error.message });
    return next(error);
  }
};

export const getAllUploads = async (req, res, next) => {
  try {
    const result = await uploadService.getAllUploads(req.query);
    return successResponse(res, HTTP_STATUS.OK, UPLOAD_MESSAGES.UPLOADS_FETCHED, result);
  } catch (error) {
    logger.error('getAllUploads controller failed', { error: error.message });
    return next(error);
  }
};

export const deleteUpload = async (req, res, next) => {
  try {
    const upload = await uploadService.deleteUpload(req.params.id, req.user?.user_id);
    return successResponse(res, HTTP_STATUS.OK, UPLOAD_MESSAGES.UPLOAD_DELETED, upload);
  } catch (error) {
    logger.error('deleteUpload controller failed', { error: error.message });
    return next(error);
  }
};

export default { uploadFile, getAllUploads, deleteUpload };
