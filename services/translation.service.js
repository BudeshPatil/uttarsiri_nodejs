import translationRepository from '../repositories/translation.repository.js';
import categoryRepository from '../repositories/category.repository.js';
import productRepository from '../repositories/product.repository.js';
import {
  TRANSLATION_MESSAGES,
  DEFAULT_UI_TRANSLATIONS,
} from '../constants/translation.constants.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  localizeField,
  DEFAULT_LANGUAGE,
} from '../utils/i18n.util.js';
import logger from '../config/logger.js';

export const getTranslationsByLanguage = async (language, query = {}) => {
  try {
    const lang = normalizeLanguage(language);
    if (!SUPPORTED_LANGUAGES.includes(String(language || '').toLowerCase().split('-')[0])
      && String(language || '').toLowerCase() !== lang) {
      // normalizeLanguage always falls back; reject truly unsupported only when raw is weird
    }

    const raw = String(language || '').trim().toLowerCase();
    const short = raw.split('-')[0];
    if (raw && !SUPPORTED_LANGUAGES.includes(short)) {
      throw new AppError(
        TRANSLATION_MESSAGES.LANGUAGE_UNSUPPORTED,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const namespace = query.namespace || 'ui';
    const stored = await translationRepository.listByLanguage(lang, { namespace });

    const ui = { ...(DEFAULT_UI_TRANSLATIONS[lang] || DEFAULT_UI_TRANSLATIONS[DEFAULT_LANGUAGE]) };
    for (const row of stored) {
      ui[row.key] = row.value;
    }

    // English fallback for missing UI keys
    if (lang !== DEFAULT_LANGUAGE) {
      for (const [key, value] of Object.entries(DEFAULT_UI_TRANSLATIONS[DEFAULT_LANGUAGE])) {
        if (!ui[key]) ui[key] = value;
      }
    }

    const includeCatalog = query.include_catalog !== 'false';
    let categories = {};
    let products = {};

    if (includeCatalog) {
      const categoryResult = await categoryRepository.listActiveCategories({ limit: 500 });
      categories = categoryResult.items.reduce((acc, category) => {
        acc[category.category_id] = {
          name: localizeField(category, 'name', lang),
          description: localizeField(category, 'description', lang),
          slug: category.category_slug,
        };
        return acc;
      }, {});

      const productResult = await productRepository.listActiveProducts({ limit: 500, skip: 0 });
      products = productResult.items.reduce((acc, product) => {
        acc[product.product_id] = {
          name: localizeField(product, 'name', lang),
          description: localizeField(product, 'description', lang),
          slug: product.product_slug,
        };
        return acc;
      }, {});
    }

    return {
      language: lang,
      fallback: DEFAULT_LANGUAGE,
      ui,
      categories,
      products,
    };
  } catch (error) {
    logger.error('getTranslationsByLanguage service failed', { error: error.message, language });
    throw error;
  }
};

export const seedDefaultTranslations = async () => {
  for (const [language, map] of Object.entries(DEFAULT_UI_TRANSLATIONS)) {
    for (const [key, value] of Object.entries(map)) {
      await translationRepository.upsertTranslation({
        language,
        namespace: 'ui',
        key,
        value,
      });
    }
  }
};

export default { getTranslationsByLanguage, seedDefaultTranslations };
