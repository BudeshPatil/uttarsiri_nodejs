import adminService from '../services/admin.service.js';
import { getAuditLogs } from '../services/audit.service.js';
import settingsService from '../services/settings.service.js';
import { successResponse } from '../utils/response.util.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { ADMIN_MESSAGES } from '../constants/settings.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return successResponse(res, HTTP_STATUS.OK, ADMIN_MESSAGES.DASHBOARD_FETCHED, stats);
  } catch (error) {
    logger.error('getDashboard controller failed', { error: error.message });
    return next(error);
  }
};

export const getAuditLogsHandler = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationQuery(req.query, 10);
    const result = await getAuditLogs({
      userId: req.query.user_id,
      module: req.query.module,
      action: req.query.action,
      limit,
      skip,
    });

    return successResponse(res, HTTP_STATUS.OK, ADMIN_MESSAGES.AUDIT_LOGS_FETCHED, {
      logs: result.items,
      pagination: buildPaginationMeta({
        page,
        limit,
        count: result.items.length,
        total: result.total,
      }),
    });
  } catch (error) {
    logger.error('getAuditLogs controller failed', { error: error.message });
    return next(error);
  }
};

export const getSystemSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSystemSettings();
    return successResponse(res, HTTP_STATUS.OK, ADMIN_MESSAGES.SYSTEM_SETTINGS_FETCHED, settings);
  } catch (error) {
    logger.error('getSystemSettings controller failed', { error: error.message });
    return next(error);
  }
};

export default { getDashboard, getAuditLogsHandler, getSystemSettings };
