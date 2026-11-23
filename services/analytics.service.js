import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Inventory from '../models/inventory.model.js';
import StockMovement from '../models/stockMovement.model.js';
import User from '../models/user.model.js';
import Vendor from '../models/vendor.model.js';
import Category from '../models/category.model.js';
import roleRepository from '../repositories/role.repository.js';
import { DEFAULT_COMMISSION_RATE } from '../constants/vendor.constants.js';
import {
  CANCELLED_ORDER_STATUS,
  COMPLETED_ORDER_STATUS,
  PENDING_ORDER_STATUSES,
  TREND_GRANULARITY,
} from '../constants/analytics.constants.js';
import { parseDateFilters, roundMoney, dateBucketExpression } from '../utils/analytics.util.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';

const nonCancelledMatch = (base = {}) => ({
  ...base,
  order_status: { $ne: CANCELLED_ORDER_STATUS },
});

const buildOrderMatch = (query = {}) => {
  const { filter } = parseDateFilters(query);
  const match = { ...filter };
  if (query.vendor_id) {
    match['items.vendor_id'] = query.vendor_id;
  }
  return match;
};

const productIdsForCategory = async (categoryId) => {
  if (!categoryId) return null;
  const products = await Product.find(
    { category_ids: categoryId, is_deleted: { $ne: true } },
    { product_id: 1, _id: 0 },
  ).lean();
  return products.map((p) => p.product_id);
};

const applyCategoryToOrderMatch = async (match, categoryId) => {
  if (!categoryId) return match;
  const productIds = await productIdsForCategory(categoryId);
  if (!productIds.length) {
    return { ...match, 'items.product_id': '__none__' };
  }
  return { ...match, 'items.product_id': { $in: productIds } };
};

const startOfDayIso = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const daysAgoIso = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const monthStartIso = () => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const sumRevenue = async (match) => {
  const [row] = await Order.aggregate([
    { $match: nonCancelledMatch(match) },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  return {
    revenue: roundMoney(row?.revenue),
    orders: row?.orders || 0,
  };
};

export const getOverview = async (query = {}) => {
  const match = await applyCategoryToOrderMatch(buildOrderMatch(query), query.category_id);
  const todayStart = startOfDayIso();
  const weekStart = daysAgoIso(6);
  const monthStart = monthStartIso();

  const scoped = { ...match };
  // For period KPIs ignore custom from/to on nested period calcs when not provided —
  // when from/to provided, still compute within that window for totals.
  const baseNoDate = { ...match };
  delete baseNoDate.created_at;

  const withDate = (fromIso, toIso) => {
    const m = { ...baseNoDate, created_at: { $gte: fromIso } };
    if (toIso) m.created_at.$lte = toIso;
    // If user supplied from/to, intersect
    if (match.created_at?.$gte) {
      m.created_at.$gte = match.created_at.$gte > fromIso ? match.created_at.$gte : fromIso;
    }
    if (match.created_at?.$lte) {
      m.created_at = m.created_at || {};
      m.created_at.$lte = match.created_at.$lte;
    }
    return m;
  };

  const [
    totalSales,
    dailySales,
    weeklySales,
    monthlySales,
    orderStatus,
    aovRow,
    customerRole,
    vendorCount,
    inventoryStats,
    trend,
  ] = await Promise.all([
    sumRevenue(scoped),
    sumRevenue(withDate(todayStart)),
    sumRevenue(withDate(weekStart)),
    sumRevenue(withDate(monthStart)),
    Order.aggregate([
      { $match: scoped },
      { $group: { _id: '$order_status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: nonCancelledMatch(scoped) },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
    ]),
    roleRepository.getRoleByCode('CUSTOMER'),
    Vendor.countDocuments({ is_deleted: { $ne: true } }),
    Inventory.aggregate([
      {
        $group: {
          _id: null,
          available_units: { $sum: '$available_stock' },
          low_stock: {
            $sum: {
              $cond: [{ $lte: ['$available_stock', '$low_stock_threshold'] }, 1, 0],
            },
          },
          out_of_stock: {
            $sum: { $cond: [{ $lte: ['$available_stock', 0] }, 1, 0] },
          },
          skus: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: nonCancelledMatch(scoped) },
      {
        $group: {
          _id: { $substr: ['$created_at', 0, 10] },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
    ]),
  ]);

  const statusMap = Object.fromEntries(orderStatus.map((s) => [s._id, s.count]));
  const pendingOrders = PENDING_ORDER_STATUSES.reduce((sum, s) => sum + (statusMap[s] || 0), 0);
  const completedOrders = statusMap[COMPLETED_ORDER_STATUS] || 0;
  const cancelledOrders = statusMap[CANCELLED_ORDER_STATUS] || 0;
  const totalOrders = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const aov = aovRow[0]?.orders
    ? roundMoney(aovRow[0].revenue / aovRow[0].orders)
    : 0;

  let totalCustomers = 0;
  let newCustomers = 0;
  if (customerRole?.role_id) {
    totalCustomers = await User.countDocuments({
      role_id: customerRole.role_id,
      is_deleted: { $ne: true },
    });
    const newMatch = {
      role_id: customerRole.role_id,
      is_deleted: { $ne: true },
    };
    if (match.created_at) newMatch.created_at = match.created_at;
    else newMatch.created_at = { $gte: monthStart };
    newCustomers = await User.countDocuments(newMatch);
  }

  const inv = inventoryStats[0] || {};

  return {
    filters: {
      from: query.from || null,
      to: query.to || null,
      category_id: query.category_id || null,
      vendor_id: query.vendor_id || null,
    },
    sales: {
      daily_revenue: dailySales.revenue,
      weekly_revenue: weeklySales.revenue,
      monthly_revenue: monthlySales.revenue,
      total_revenue: totalSales.revenue,
      trends: trend.map((t) => ({
        date: t._id,
        revenue: roundMoney(t.revenue),
        orders: t.orders,
      })),
    },
    orders: {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      average_order_value: aov,
      by_status: statusMap,
    },
    inventory: {
      available_stock_units: inv.available_units || 0,
      low_stock_skus: inv.low_stock || 0,
      out_of_stock_skus: inv.out_of_stock || 0,
      total_skus: inv.skus || 0,
    },
    customers: {
      total_customers: totalCustomers,
      new_customers: newCustomers,
    },
    vendors: {
      total_vendors: vendorCount,
    },
  };
};

export const getSalesReport = async (query = {}) => {
  const match = await applyCategoryToOrderMatch(buildOrderMatch(query), query.category_id);
  const granularity = query.granularity || TREND_GRANULARITY.DAY;

  const [overviewBits, trends, byPayment] = await Promise.all([
    getOverview(query),
    Order.aggregate([
      { $match: nonCancelledMatch(match) },
      {
        $group: {
          _id: dateBucketExpression(granularity),
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
          subtotal: { $sum: '$subtotal' },
          discount: { $sum: '$discount' },
          tax: { $sum: '$tax' },
          delivery_charges: { $sum: '$delivery_charges' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: nonCancelledMatch(match) },
      {
        $group: {
          _id: '$payment_method',
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    summary: overviewBits.sales,
    trends: trends.map((t) => ({
      period: t._id,
      revenue: roundMoney(t.revenue),
      orders: t.orders,
      subtotal: roundMoney(t.subtotal),
      discount: roundMoney(t.discount),
      tax: roundMoney(t.tax),
      delivery_charges: roundMoney(t.delivery_charges),
    })),
    by_payment_method: byPayment.map((p) => ({
      payment_method: p._id || 'unknown',
      revenue: roundMoney(p.revenue),
      orders: p.orders,
    })),
    granularity,
  };
};

export const getOrdersReport = async (query = {}) => {
  const match = await applyCategoryToOrderMatch(buildOrderMatch(query), query.category_id);
  const { page, limit, skip } = parsePaginationQuery(query, 20);

  const [overview, items, total] = await Promise.all([
    getOverview(query),
    Order.find(match)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .select({
        order_id: 1,
        order_number: 1,
        customer_id: 1,
        customer_name: 1,
        customer_email: 1,
        order_status: 1,
        payment_status: 1,
        payment_method: 1,
        total: 1,
        subtotal: 1,
        discount: 1,
        tax: 1,
        delivery_charges: 1,
        created_at: 1,
        _id: 0,
      })
      .lean(),
    Order.countDocuments(match),
  ]);

  return {
    summary: overview.orders,
    rows: items,
    pagination: buildPaginationMeta({ page, limit, count: items.length, total }),
  };
};

export const getProductsReport = async (query = {}) => {
  const match = buildOrderMatch(query);
  const categoryProductIds = query.category_id ? await productIdsForCategory(query.category_id) : null;
  const { page, limit, skip } = parsePaginationQuery(query, 20);

  const itemMatch = { ...nonCancelledMatch(match) };
  // unwind items then filter
  const pipeline = [
    { $match: itemMatch },
    { $unwind: '$items' },
  ];
  if (query.vendor_id) {
    pipeline.push({ $match: { 'items.vendor_id': query.vendor_id } });
  }
  if (categoryProductIds) {
    pipeline.push({
      $match: {
        'items.product_id': categoryProductIds.length
          ? { $in: categoryProductIds }
          : '__none__',
      },
    });
  }

  const productPipeline = [
    ...pipeline,
    {
      $group: {
        _id: '$items.product_id',
        product_name: { $first: '$items.product_name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.line_total' },
        orders: { $addToSet: '$order_id' },
      },
    },
    {
      $project: {
        product_id: '$_id',
        product_name: 1,
        quantity: 1,
        revenue: 1,
        order_count: { $size: '$orders' },
        _id: 0,
      },
    },
    { $sort: { revenue: -1 } },
  ];

  const variantPipeline = [
    ...pipeline,
    {
      $group: {
        _id: '$items.variant_id',
        product_id: { $first: '$items.product_id' },
        product_name: { $first: '$items.product_name' },
        sku: { $first: '$items.sku' },
        unit_label: { $first: '$items.unit_label' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.line_total' },
      },
    },
    {
      $project: {
        variant_id: '$_id',
        product_id: 1,
        product_name: 1,
        sku: 1,
        unit_label: 1,
        quantity: 1,
        revenue: 1,
        _id: 0,
      },
    },
    { $sort: { revenue: -1 } },
  ];

  const [productAgg, variantAgg, categories] = await Promise.all([
    Order.aggregate(productPipeline),
    Order.aggregate(variantPipeline),
    Category.find({ is_deleted: { $ne: true } }, { category_id: 1, name_en: 1, category_slug: 1 }).lean(),
  ]);

  const productMeta = await Product.find(
    { product_id: { $in: productAgg.map((p) => p.product_id).filter(Boolean) } },
    { product_id: 1, category_ids: 1, name_en: 1 },
  ).lean();
  const productCategoryMap = new Map(productMeta.map((p) => [p.product_id, p.category_ids || []]));
  const categoryNameMap = new Map(categories.map((c) => [c.category_id, c.name_en || c.category_slug]));

  const categorySales = new Map();
  for (const row of productAgg) {
    const cats = productCategoryMap.get(row.product_id) || [];
    const targets = cats.length ? cats : ['uncategorised'];
    for (const catId of targets) {
      if (query.category_id && catId !== query.category_id) continue;
      const prev = categorySales.get(catId) || {
        category_id: catId,
        category_name: categoryNameMap.get(catId) || 'Uncategorised',
        revenue: 0,
        quantity: 0,
      };
      prev.revenue += Number(row.revenue) || 0;
      prev.quantity += Number(row.quantity) || 0;
      categorySales.set(catId, prev);
    }
  }

  const bestSellers = productAgg.slice(0, 10).map((p) => ({
    ...p,
    revenue: roundMoney(p.revenue),
  }));
  const lowPerforming = [...productAgg]
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 10)
    .map((p) => ({ ...p, revenue: roundMoney(p.revenue) }));

  const variantRows = variantAgg.map((v) => ({ ...v, revenue: roundMoney(v.revenue) }));
  const pagedVariants = variantRows.slice(skip, skip + limit);

  return {
    best_sellers: bestSellers,
    low_performing: lowPerforming,
    category_sales: [...categorySales.values()]
      .map((c) => ({ ...c, revenue: roundMoney(c.revenue) }))
      .sort((a, b) => b.revenue - a.revenue),
    variant_sales: pagedVariants,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: pagedVariants.length,
      total: variantRows.length,
    }),
  };
};

export const getInventoryReport = async (query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const { filter } = parseDateFilters(query);

  const inventoryMatch = {};
  if (query.vendor_id || query.category_id) {
    const productFilter = { is_deleted: { $ne: true } };
    if (query.vendor_id) productFilter.vendor_id = query.vendor_id;
    if (query.category_id) productFilter.category_ids = query.category_id;
    const products = await Product.find(productFilter, { product_id: 1 }).lean();
    inventoryMatch.product_id = { $in: products.map((p) => p.product_id) };
  }

  const [summaryRows, stockRows, totalStock, movements, totalMovements] = await Promise.all([
    Inventory.aggregate([
      { $match: inventoryMatch },
      {
        $group: {
          _id: null,
          available_stock: { $sum: '$available_stock' },
          reserved_stock: { $sum: '$reserved_stock' },
          low_stock: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$available_stock', 0] }, { $lte: ['$available_stock', '$low_stock_threshold'] }] }, 1, 0],
            },
          },
          out_of_stock: {
            $sum: { $cond: [{ $lte: ['$available_stock', 0] }, 1, 0] },
          },
          skus: { $sum: 1 },
        },
      },
    ]),
    Inventory.find(inventoryMatch)
      .sort({ available_stock: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inventory.countDocuments(inventoryMatch),
    StockMovement.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StockMovement.countDocuments(filter),
  ]);

  const summary = summaryRows[0] || {};

  return {
    summary: {
      available_stock: summary.available_stock || 0,
      reserved_stock: summary.reserved_stock || 0,
      low_stock: summary.low_stock || 0,
      out_of_stock: summary.out_of_stock || 0,
      total_skus: summary.skus || 0,
    },
    stock: stockRows.map((row) => ({
      inventory_id: row.inventory_id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      available_stock: row.available_stock,
      reserved_stock: row.reserved_stock,
      low_stock_threshold: row.low_stock_threshold,
      status:
        row.available_stock <= 0
          ? 'out_of_stock'
          : row.available_stock <= row.low_stock_threshold
            ? 'low_stock'
            : 'in_stock',
      updated_at: row.updated_at,
    })),
    movements: movements.map((m) => ({
      movement_id: m.movement_id,
      product_id: m.product_id,
      variant_id: m.variant_id,
      movement_type: m.movement_type,
      quantity: m.quantity,
      previous_available: m.previous_available,
      new_available: m.new_available,
      reason: m.reason,
      reference_id: m.reference_id,
      created_at: m.created_at,
    })),
    pagination: buildPaginationMeta({
      page,
      limit,
      count: stockRows.length,
      total: totalStock,
    }),
    movements_pagination: buildPaginationMeta({
      page,
      limit,
      count: movements.length,
      total: totalMovements,
    }),
  };
};

export const getCustomersReport = async (query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const { filter } = parseDateFilters(query);
  const customerRole = await roleRepository.getRoleByCode('CUSTOMER');
  const roleId = customerRole?.role_id;

  if (!roleId) {
    return {
      summary: { total_customers: 0, new_customers: 0, repeat_customers: 0 },
      customers: [],
      pagination: buildPaginationMeta({ page, limit, count: 0, total: 0 }),
    };
  }

  const userBase = { role_id: roleId, is_deleted: { $ne: true } };
  const newFilter = { ...userBase };
  if (filter.created_at) newFilter.created_at = filter.created_at;

  const orderMatch = buildOrderMatch(query);

  const [totalCustomers, newCustomers, orderStats, customerPage, totalPage] = await Promise.all([
    User.countDocuments(userBase),
    User.countDocuments(newFilter),
    Order.aggregate([
      { $match: nonCancelledMatch(orderMatch) },
      {
        $group: {
          _id: '$customer_id',
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
          last_order_at: { $max: '$created_at' },
          customer_name: { $first: '$customer_name' },
          customer_email: { $first: '$customer_email' },
          customer_phone: { $first: '$customer_phone' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    User.find(userBase)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .select({ user_id: 1, name: 1, email: 1, phone: 1, created_at: 1, preferred_language: 1, _id: 0 })
      .lean(),
    User.countDocuments(userBase),
  ]);

  const repeatCustomers = orderStats.filter((c) => c.orders >= 2).length;
  const orderByCustomer = new Map(orderStats.map((c) => [c._id, c]));

  const rows = customerPage.map((user) => {
    const stats = orderByCustomer.get(user.user_id);
    return {
      customer_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferred_language: user.preferred_language,
      created_at: user.created_at,
      order_count: stats?.orders || 0,
      lifetime_revenue: roundMoney(stats?.revenue),
      last_order_at: stats?.last_order_at || null,
    };
  });

  // Optional: customer order history for a specific customer via query.customer_id
  let orderHistory = [];
  let orderHistoryPagination = null;
  if (query.customer_id) {
    const historyMatch = { ...orderMatch, customer_id: query.customer_id };
    const [history, historyTotal] = await Promise.all([
      Order.find(historyMatch)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          order_id: 1,
          order_number: 1,
          order_status: 1,
          payment_status: 1,
          total: 1,
          created_at: 1,
          _id: 0,
        })
        .lean(),
      Order.countDocuments(historyMatch),
    ]);
    orderHistory = history;
    orderHistoryPagination = buildPaginationMeta({
      page,
      limit,
      count: history.length,
      total: historyTotal,
    });
  }

  return {
    summary: {
      total_customers: totalCustomers,
      new_customers: newCustomers,
      repeat_customers: repeatCustomers,
    },
    top_customers: orderStats.slice(0, 10).map((c) => ({
      customer_id: c._id,
      customer_name: c.customer_name,
      customer_email: c.customer_email,
      order_count: c.orders,
      lifetime_revenue: roundMoney(c.revenue),
      last_order_at: c.last_order_at,
    })),
    customers: rows,
    pagination: buildPaginationMeta({ page, limit, count: rows.length, total: totalPage }),
    order_history: orderHistory,
    order_history_pagination: orderHistoryPagination,
  };
};

export const getVendorsReport = async (query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const match = buildOrderMatch(query);
  if (query.vendor_id) {
    // already in match via items.vendor_id
  }

  const vendors = await Vendor.find(
    query.vendor_id
      ? { vendor_id: query.vendor_id, is_deleted: { $ne: true } }
      : { is_deleted: { $ne: true } },
  )
    .sort({ created_at: -1 })
    .lean();

  const salesAgg = await Order.aggregate([
    { $match: nonCancelledMatch(match) },
    { $unwind: '$items' },
    ...(query.vendor_id ? [{ $match: { 'items.vendor_id': query.vendor_id } }] : [{ $match: { 'items.vendor_id': { $ne: null } } }]),
    {
      $group: {
        _id: '$items.vendor_id',
        revenue: { $sum: '$items.line_total' },
        quantity: { $sum: '$items.quantity' },
        order_ids: { $addToSet: '$order_id' },
      },
    },
  ]);

  const salesMap = new Map(
    salesAgg.map((s) => [
      s._id,
      {
        revenue: roundMoney(s.revenue),
        quantity: s.quantity,
        order_count: s.order_ids.length,
      },
    ]),
  );

  const rows = vendors.map((vendor) => {
    const sales = salesMap.get(vendor.vendor_id) || { revenue: 0, quantity: 0, order_count: 0 };
    const rate = vendor.commission_rate ?? DEFAULT_COMMISSION_RATE;
    const commission = roundMoney(sales.revenue * rate);
    return {
      vendor_id: vendor.vendor_id,
      business_name: vendor.business_name,
      owner_name: vendor.owner_name,
      status: vendor.status,
      commission_rate: rate,
      sales: sales.revenue,
      orders: sales.order_count,
      quantity: sales.quantity,
      commission,
      settlement_net: roundMoney(sales.revenue - commission),
      settlement_status: 'pending_payout',
    };
  });

  rows.sort((a, b) => b.sales - a.sales);
  const paged = rows.slice(skip, skip + limit);

  return {
    summary: {
      total_vendors: vendors.length,
      total_sales: roundMoney(rows.reduce((s, r) => s + r.sales, 0)),
      total_orders: rows.reduce((s, r) => s + r.orders, 0),
      total_commission: roundMoney(rows.reduce((s, r) => s + r.commission, 0)),
      total_settlements: roundMoney(rows.reduce((s, r) => s + r.settlement_net, 0)),
    },
    vendors: paged,
    pagination: buildPaginationMeta({ page, limit, count: paged.length, total: rows.length }),
  };
};

const sectionHandlers = {
  overview: getOverview,
  sales: getSalesReport,
  orders: getOrdersReport,
  products: getProductsReport,
  inventory: getInventoryReport,
  customers: getCustomersReport,
  vendors: getVendorsReport,
};

export const getExportRows = async (query = {}) => {
  const section = query.section || 'sales';
  const handler = sectionHandlers[section];
  if (!handler) {
    return { section, columns: [], rows: [] };
  }

  const data = await handler({ ...query, limit: Math.min(Number(query.limit) || 100, 100), page: 1 });

  if (section === 'sales') {
    return {
      section,
      columns: ['period', 'revenue', 'orders', 'subtotal', 'discount', 'tax', 'delivery_charges'],
      rows: (data.trends || []).map((t) => [
        t.period,
        t.revenue,
        t.orders,
        t.subtotal,
        t.discount,
        t.tax,
        t.delivery_charges,
      ]),
    };
  }
  if (section === 'orders') {
    return {
      section,
      columns: [
        'order_number',
        'customer_name',
        'order_status',
        'payment_status',
        'payment_method',
        'total',
        'created_at',
      ],
      rows: (data.rows || []).map((o) => [
        o.order_number,
        o.customer_name,
        o.order_status,
        o.payment_status,
        o.payment_method,
        o.total,
        o.created_at,
      ]),
    };
  }
  if (section === 'products') {
    return {
      section,
      columns: ['variant_id', 'product_name', 'sku', 'unit_label', 'quantity', 'revenue'],
      rows: (data.variant_sales || []).map((v) => [
        v.variant_id,
        v.product_name,
        v.sku,
        v.unit_label,
        v.quantity,
        v.revenue,
      ]),
    };
  }
  if (section === 'inventory') {
    return {
      section,
      columns: ['variant_id', 'product_id', 'available_stock', 'reserved_stock', 'status', 'updated_at'],
      rows: (data.stock || []).map((s) => [
        s.variant_id,
        s.product_id,
        s.available_stock,
        s.reserved_stock,
        s.status,
        s.updated_at,
      ]),
    };
  }
  if (section === 'customers') {
    return {
      section,
      columns: ['customer_id', 'name', 'email', 'phone', 'order_count', 'lifetime_revenue', 'created_at'],
      rows: (data.customers || []).map((c) => [
        c.customer_id,
        c.name,
        c.email,
        c.phone,
        c.order_count,
        c.lifetime_revenue,
        c.created_at,
      ]),
    };
  }
  if (section === 'vendors') {
    return {
      section,
      columns: [
        'business_name',
        'status',
        'sales',
        'orders',
        'commission_rate',
        'commission',
        'settlement_net',
        'settlement_status',
      ],
      rows: (data.vendors || []).map((v) => [
        v.business_name,
        v.status,
        v.sales,
        v.orders,
        v.commission_rate,
        v.commission,
        v.settlement_net,
        v.settlement_status,
      ]),
    };
  }

  // overview
  return {
    section,
    columns: ['metric', 'value'],
    rows: [
      ['daily_revenue', data.sales?.daily_revenue],
      ['weekly_revenue', data.sales?.weekly_revenue],
      ['monthly_revenue', data.sales?.monthly_revenue],
      ['total_revenue', data.sales?.total_revenue],
      ['total_orders', data.orders?.total_orders],
      ['pending_orders', data.orders?.pending_orders],
      ['completed_orders', data.orders?.completed_orders],
      ['cancelled_orders', data.orders?.cancelled_orders],
      ['average_order_value', data.orders?.average_order_value],
      ['total_customers', data.customers?.total_customers],
      ['total_vendors', data.vendors?.total_vendors],
    ],
  };
};

export default {
  getOverview,
  getSalesReport,
  getOrdersReport,
  getProductsReport,
  getInventoryReport,
  getCustomersReport,
  getVendorsReport,
  getExportRows,
};
