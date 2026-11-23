import settingsRepository from '../repositories/settings.repository.js';
import { SETTING_KEYS, SETTINGS_MESSAGES, AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import { createEmailTransporter } from '../config/email.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

const DEFAULT_SETTINGS = {
  [SETTING_KEYS.SMTP_CONFIG]: {},
  [SETTING_KEYS.SENDER_EMAIL]: '',
  [SETTING_KEYS.RECEIVER_EMAIL]: '',
  [SETTING_KEYS.GOOGLE_ANALYTICS]: {},
  [SETTING_KEYS.GOOGLE_TAG_MANAGER]: {},
  [SETTING_KEYS.SITEMAP_SETTINGS]: { urls: [], changefreq: 'weekly', priority: 0.8 },
  [SETTING_KEYS.ROBOTS_SETTINGS]: { allow: ['*'], disallow: [] },
  [SETTING_KEYS.SEO_SETTINGS]: { title: '', description: '', keywords: [], ogImage: '' },
  [SETTING_KEYS.CONTACT_DETAILS]: { email: '', phone: '', address: '' },
  [SETTING_KEYS.SOCIAL_MEDIA_LINKS]: { facebook: '', twitter: '', linkedin: '', instagram: '' },
  [SETTING_KEYS.SITE_LOGO]: '',
  [SETTING_KEYS.SITE_FAVICON]: '',
  // Seeded with the values the website used to hard-code, so nothing changes
  // visually until someone edits them.
  [SETTING_KEYS.SITE_STATS]: [
    { value: '500+', label: 'Projects Completed' },
    { value: '450+', label: 'Happy Clients' },
    { value: '15+', label: 'Years Experience' },
    { value: '50+', label: 'Expert Team' },
  ],
};

/**
 * Stats are rendered straight into the marketing pages, so keep the stored shape
 * predictable: an array of { value, label } strings with the blanks dropped.
 */
const normaliseStats = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      value: String(item?.value ?? '').trim(),
      label: String(item?.label ?? '').trim(),
    }))
    .filter((item) => item.value || item.label);
};

export const getSettings = async () => {
  try {
    const settings = await settingsRepository.getAllSettings();
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    logger.error('getSettings service failed', { error: error.message });
    throw error;
  }
};

/**
 * Everything the public website is allowed to read without a token.
 * Explicit allowlist — never spread the whole settings object here, it holds
 * SMTP credentials.
 */
export const getPublicSettings = async () => {
  try {
    const settings = await getSettings();
    return {
      SITE_LOGO: settings[SETTING_KEYS.SITE_LOGO] || '',
      SITE_FAVICON: settings[SETTING_KEYS.SITE_FAVICON] || '',
      SITE_STATS: normaliseStats(settings[SETTING_KEYS.SITE_STATS]),
    };
  } catch (error) {
    logger.error('getPublicSettings service failed', { error: error.message });
    throw error;
  }
};

/** Public branding fields only (safe for SignIn/SignUp without auth). */
export const getBranding = async () => {
  try {
    const settings = await getSettings();
    return {
      SITE_LOGO: settings[SETTING_KEYS.SITE_LOGO] || '',
      SITE_FAVICON: settings[SETTING_KEYS.SITE_FAVICON] || '',
    };
  } catch (error) {
    logger.error('getBranding service failed', { error: error.message });
    throw error;
  }
};

export const updateSettings = async (payload, userId) => {
  try {
    const oldSettings = await settingsRepository.getAllSettings();
    const allowedKeys = Object.values(SETTING_KEYS);
    const updates = {};

    Object.entries(payload).forEach(([key, value]) => {
      if (!allowedKeys.includes(key)) return;
      updates[key] = key === SETTING_KEYS.SITE_STATS ? normaliseStats(value) : value;
    });

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid settings provided', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    await settingsRepository.batchUpsertSettings(updates);

    if (updates[SETTING_KEYS.SMTP_CONFIG]) {
      createEmailTransporter(updates[SETTING_KEYS.SMTP_CONFIG]);
    }

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.SETTINGS_UPDATE,
      module: 'SETTINGS',
      oldData: oldSettings,
      newData: updates,
    });

    const allSettings = await getSettings();
    return allSettings;
  } catch (error) {
    logger.error('updateSettings service failed', { error: error.message });
    throw error;
  }
};

export const getSystemSettings = async () => {
  try {
    return await getSettings();
  } catch (error) {
    logger.error('getSystemSettings service failed', { error: error.message });
    throw error;
  }
};

export default { getSettings, getBranding, getPublicSettings, updateSettings, getSystemSettings };
