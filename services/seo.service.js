import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import settingsRepository from '../repositories/settings.repository.js';
import { SETTING_KEYS, SEO_MESSAGES, AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '../../public');

const ensurePublicDir = () => {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
};

export const getSeoSettings = async () => {
  try {
    const seoSetting = await settingsRepository.getSetting(SETTING_KEYS.SEO_SETTINGS);
    const sitemapSetting = await settingsRepository.getSetting(SETTING_KEYS.SITEMAP_SETTINGS);
    const robotsSetting = await settingsRepository.getSetting(SETTING_KEYS.ROBOTS_SETTINGS);
    const gtmSetting = await settingsRepository.getSetting(SETTING_KEYS.GOOGLE_TAG_MANAGER);
    const gaSetting = await settingsRepository.getSetting(SETTING_KEYS.GOOGLE_ANALYTICS);

    return {
      seo: seoSetting?.value || {},
      sitemap: sitemapSetting?.value || {},
      robots: robotsSetting?.value || {},
      google_tag_manager: gtmSetting?.value || {},
      google_analytics: gaSetting?.value || {},
    };
  } catch (error) {
    logger.error('getSeoSettings service failed', { error: error.message });
    throw error;
  }
};

export const updateSeoSettings = async (payload, userId) => {
  try {
    const oldSeo = await getSeoSettings();
    const updates = {};

    if (payload.seo) updates[SETTING_KEYS.SEO_SETTINGS] = payload.seo;
    if (payload.sitemap) updates[SETTING_KEYS.SITEMAP_SETTINGS] = payload.sitemap;
    if (payload.robots) updates[SETTING_KEYS.ROBOTS_SETTINGS] = payload.robots;
    if (payload.google_tag_manager) updates[SETTING_KEYS.GOOGLE_TAG_MANAGER] = payload.google_tag_manager;
    if (payload.google_analytics) updates[SETTING_KEYS.GOOGLE_ANALYTICS] = payload.google_analytics;

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid SEO settings provided', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    await settingsRepository.batchUpsertSettings(updates);

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.SEO_UPDATE,
      module: 'SEO',
      oldData: oldSeo,
      newData: updates,
    });

    return await getSeoSettings();
  } catch (error) {
    logger.error('updateSeoSettings service failed', { error: error.message });
    throw error;
  }
};

export const generateSitemap = async (userId) => {
  try {
    ensurePublicDir();
    const sitemapSetting = await settingsRepository.getSetting(SETTING_KEYS.SITEMAP_SETTINGS);
    const config = sitemapSetting?.value || { urls: [], changefreq: 'weekly', priority: 0.8 };
    const baseUrl = config.baseUrl || process.env.FRONTEND_URL || 'https://innoventies.com';
    const urls = config.urls?.length ? config.urls : ['/', '/about', '/contact', '/products'];

    const urlEntries = urls
      .map(
        (url) => `  <url>
    <loc>${baseUrl}${url.startsWith('/') ? url : `/${url}`}</loc>
    <changefreq>${config.changefreq || 'weekly'}</changefreq>
    <priority>${config.priority || 0.8}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`,
      )
      .join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    const filePath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(filePath, sitemapXml, 'utf-8');

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'SEO',
      newData: { file: '/public/sitemap.xml' },
    });

    logger.info('Sitemap generated', { path: filePath });
    return { message: SEO_MESSAGES.SITEMAP_GENERATED, path: '/public/sitemap.xml' };
  } catch (error) {
    logger.error('generateSitemap service failed', { error: error.message });
    throw error;
  }
};

export const generateRobots = async (userId) => {
  try {
    ensurePublicDir();
    const robotsSetting = await settingsRepository.getSetting(SETTING_KEYS.ROBOTS_SETTINGS);
    const config = robotsSetting?.value || { allow: ['*'], disallow: [] };
    const baseUrl = process.env.FRONTEND_URL || 'https://innoventies.com';

    const allowRules = (config.allow || ['*']).map((path) => `Allow: ${path}`).join('\n');
    const disallowRules = (config.disallow || []).map((path) => `Disallow: ${path}`).join('\n');

    const robotsTxt = `User-agent: *
${allowRules}
${disallowRules}

Sitemap: ${baseUrl}/sitemap.xml`;

    const filePath = path.join(publicDir, 'robots.txt');
    fs.writeFileSync(filePath, robotsTxt, 'utf-8');

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: 'SEO',
      newData: { file: '/public/robots.txt' },
    });

    logger.info('Robots.txt generated', { path: filePath });
    return { message: SEO_MESSAGES.ROBOTS_GENERATED, path: '/public/robots.txt' };
  } catch (error) {
    logger.error('generateRobots service failed', { error: error.message });
    throw error;
  }
};

export default { getSeoSettings, updateSeoSettings, generateSitemap, generateRobots };
