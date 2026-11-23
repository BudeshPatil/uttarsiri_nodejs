import translationService from '../services/translation.service.js';
import { successResponse } from '../utils/response.util.js';
import { TRANSLATION_MESSAGES } from '../constants/translation.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const getTranslationsByLanguage = async (req, res, next) => {
  try {
    const result = await translationService.getTranslationsByLanguage(
      req.params.language,
      req.query,
    );
    return successResponse(res, HTTP_STATUS.OK, TRANSLATION_MESSAGES.TRANSLATIONS_FETCHED, result);
  } catch (error) {
    logger.error('getTranslationsByLanguage controller failed', { error: error.message });
    return next(error);
  }
};

export default { getTranslationsByLanguage };
