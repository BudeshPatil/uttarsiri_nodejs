import cmsRepository from '../repositories/cms.repository.js';
import { CMS_MESSAGES } from '../constants/cms.constants.js';
import { AUDIT_ACTIONS } from '../constants/settings.constants.js';
import { createAuditLog } from './audit.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

export const createPage = async (payload, userId) => {
  try {
    const existing = await cmsRepository.getPageBySlug(payload.slug);
    if (existing) {
      throw new AppError(CMS_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const page = await cmsRepository.createPage(payload, userId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.CREATE, module: 'CMS', newData: page });
    return page;
  } catch (error) {
    logger.error('createPage service failed', { error: error.message });
    throw error;
  }
};

export const getAllPages = async (query = {}) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(query, 10);
    const result = await cmsRepository.listPages({ status: query.status, limit, skip });

    return {
      pages: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    };
  } catch (error) {
    logger.error('getAllPages service failed', { error: error.message });
    throw error;
  }
};

export const getPageById = async (pageId) => {
  try {
    const page = await cmsRepository.getPageById(pageId);
    if (!page) {
      throw new AppError(CMS_MESSAGES.PAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return page;
  } catch (error) {
    logger.error('getPageById service failed', { error: error.message, pageId });
    throw error;
  }
};

export const updatePage = async (pageId, payload, userId) => {
  try {
    const existing = await cmsRepository.getPageById(pageId);
    if (!existing) {
      throw new AppError(CMS_MESSAGES.PAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (payload.slug && payload.slug.toLowerCase() !== existing.slug) {
      const duplicate = await cmsRepository.getPageBySlug(payload.slug);
      if (duplicate && duplicate.page_id !== pageId) {
        throw new AppError(CMS_MESSAGES.SLUG_EXISTS, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
      }
    }

    const updated = await cmsRepository.updatePage(pageId, { ...payload, updated_by: userId });

    await createAuditLog({ userId, action: AUDIT_ACTIONS.UPDATE, module: 'CMS', oldData: existing, newData: updated });
    return updated;
  } catch (error) {
    logger.error('updatePage service failed', { error: error.message, pageId });
    throw error;
  }
};

export const deletePage = async (pageId, userId) => {
  try {
    const existing = await cmsRepository.getPageById(pageId);
    if (!existing) {
      throw new AppError(CMS_MESSAGES.PAGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const deleted = await cmsRepository.softDeletePage(pageId, userId);

    await createAuditLog({ userId, action: AUDIT_ACTIONS.DELETE, module: 'CMS', oldData: existing });
    return deleted;
  } catch (error) {
    logger.error('deletePage service failed', { error: error.message, pageId });
    throw error;
  }
};

export default { createPage, getAllPages, getPageById, updatePage, deletePage };
