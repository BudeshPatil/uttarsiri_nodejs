export const SUPPORTED_LANGUAGES = ['en', 'kn', 'hi'];
export const DEFAULT_LANGUAGE = 'en';

export const normalizeLanguage = (lang) => {
  const code = String(lang || DEFAULT_LANGUAGE).trim().toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(code)) return code;
  const short = code.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(short) ? short : DEFAULT_LANGUAGE;
};

/**
 * Pick localized field with English fallback.
 * Supports either flat fields (name_en) or nested ({ en, kn, hi }).
 */
export const localizeField = (entity, fieldBase, language = DEFAULT_LANGUAGE) => {
  if (!entity) return '';
  const lang = normalizeLanguage(language);
  const nested = entity[fieldBase];

  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested[lang] || nested[DEFAULT_LANGUAGE] || nested.en || '';
  }

  const primary = entity[`${fieldBase}_${lang}`];
  if (primary !== undefined && primary !== null && String(primary).trim() !== '') {
    return primary;
  }

  const fallback = entity[`${fieldBase}_${DEFAULT_LANGUAGE}`];
  return fallback ?? '';
};

export const withLocalizedFields = (entity, fields = ['name', 'description'], language = DEFAULT_LANGUAGE) => {
  if (!entity) return entity;
  const lang = normalizeLanguage(language);
  const localized = { ...entity, locale: lang };

  for (const field of fields) {
    localized[field] = localizeField(entity, field, lang);
  }

  return localized;
};

export const localizeMany = (items = [], fields = ['name', 'description'], language = DEFAULT_LANGUAGE) =>
  items.map((item) => withLocalizedFields(item, fields, language));

export const buildMultilingualSearchFilter = (search, fields = []) => {
  const term = String(search || '').trim();
  if (!term || !fields.length) return null;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  return {
    $or: fields.flatMap((field) => [
      { [field]: regex },
      { [`${field}_en`]: regex },
      { [`${field}_kn`]: regex },
      { [`${field}_hi`]: regex },
    ]),
  };
};

export default {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  localizeField,
  withLocalizedFields,
  localizeMany,
  buildMultilingualSearchFilter,
};
