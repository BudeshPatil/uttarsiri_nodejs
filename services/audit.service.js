import auditRepository from '../repositories/audit.repository.js';
import logger from '../config/logger.js';

export const createAuditLog = async ({ userId, action, module, oldData = null, newData = null }) => {
  try {
    const log = await auditRepository.createLog({
      user_id: userId,
      action,
      module,
      old_data: oldData,
      new_data: newData,
    });
    logger.info('Audit log created', { user_id: userId, action, module });
    return log;
  } catch (error) {
    logger.error('createAuditLog failed', { error: error.message });
    throw error;
  }
};

export const getAuditLogs = async (query = {}) => {
  try {
    const { userId, module, action, limit, lastEvaluatedKey, skip } = query;
    const options = { limit, lastEvaluatedKey, skip };

    if (userId) {
      return await auditRepository.getLogsByUser(userId, options);
    }
    if (module) {
      return await auditRepository.getLogsByModule(module, options);
    }
    if (action) {
      return await auditRepository.getLogsByAction(action, options);
    }
    return await auditRepository.listLogs(options);
  } catch (error) {
    logger.error('getAuditLogs failed', { error: error.message });
    throw error;
  }
};

export default { createAuditLog, getAuditLogs };
