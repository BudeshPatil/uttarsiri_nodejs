/**
 * Build Mongo match filters for analytics date/vendor scopes.
 * Order.created_at is stored as ISO string — lexicographic range works.
 */
export const parseDateFilters = (query = {}) => {
  const filter = {};
  const from = query.from ? String(query.from).slice(0, 10) : null;
  const to = query.to ? String(query.to).slice(0, 10) : null;

  if (from || to) {
    filter.created_at = {};
    if (from) filter.created_at.$gte = `${from}T00:00:00.000Z`;
    if (to) filter.created_at.$lte = `${to}T23:59:59.999Z`;
  }

  return { filter, from, to };
};

export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const dateBucketExpression = (granularity = 'day') => {
  if (granularity === 'month') {
    return { $substr: ['$created_at', 0, 7] }; // YYYY-MM
  }
  if (granularity === 'week') {
    return {
      $dateToString: {
        format: '%G-W%V',
        date: { $dateFromString: { dateString: '$created_at' } },
      },
    };
  }
  return { $substr: ['$created_at', 0, 10] }; // YYYY-MM-DD
};

export default { parseDateFilters, roundMoney, dateBucketExpression };
