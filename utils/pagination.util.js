const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse page/limit query into skip-based pagination.
 * @param {object} query - Express query object
 * @param {number} defaultLimit - Default page size
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const parsePaginationQuery = (query = {}, defaultLimit = DEFAULT_LIMIT) => {
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || defaultLimit));
  const page = Math.max(1, Number(query.page) || 1);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination meta matching frontend contract:
 * { page, limit, total, totalPages, count, hasNext, hasPrev }
 */
export const buildPaginationMeta = ({ page, limit, count, total }) => {
  const safeTotal = Number(total) || 0;
  const safeCount = Number(count) || 0;
  const totalPages = safeTotal === 0 ? 1 : Math.ceil(safeTotal / limit);

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    count: safeCount,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export default { parsePaginationQuery, buildPaginationMeta };
