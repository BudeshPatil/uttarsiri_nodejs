import vendorRepository from '../repositories/vendor.repository.js';
import productRepository from '../repositories/product.repository.js';
import productVariantRepository from '../repositories/productVariant.repository.js';
import inventoryRepository from '../repositories/inventory.repository.js';
import orderRepository from '../repositories/order.repository.js';
import userRepository from '../repositories/user.repository.js';
import roleRepository from '../repositories/role.repository.js';
import productService from './product.service.js';
import inventoryService from './inventory.service.js';
import { hashPassword } from '../utils/password.util.js';
import { sanitizeUser } from '../models/user.model.js';
import { USER_STATUS } from '../constants/user.constants.js';
import { PRODUCT_STATUS } from '../constants/product.constants.js';
import {
  DEFAULT_COMMISSION_RATE,
  VENDOR_MESSAGES,
  VENDOR_ORDER_ITEM_STATUS,
  VENDOR_STATUS,
} from '../constants/vendor.constants.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import { withLocalizedFields, normalizeLanguage } from '../utils/i18n.util.js';
import Order from '../models/order.model.js';
import logger from '../config/logger.js';

const ensureVendorRole = async () => {
  let role = await roleRepository.getRoleByCode('VENDOR');
  if (!role) {
    role = await roleRepository.createRole({
      role_name: 'Vendor',
      role_code: 'VENDOR',
      description: 'Grocery supplier portal access',
      permissions: [],
      is_active: true,
    });
  }
  return role;
};

const assertOwnsProduct = async (vendorId, productId) => {
  const product = await productRepository.getProductById(productId);
  if (!product || product.vendor_id !== vendorId) {
    throw new AppError(VENDOR_MESSAGES.ACCESS_DENIED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
  return product;
};

export const registerVendor = async (payload) => {
  try {
    const existingEmail = await userRepository.getUserByEmail(payload.email);
    if (existingEmail && !existingEmail.is_deleted) {
      throw new AppError('Email already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    const existingPhone = await userRepository.getUserByPhone(payload.mobile);
    if (existingPhone && !existingPhone.is_deleted) {
      throw new AppError('Phone number already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }

    const role = await ensureVendorRole();
    const hashed = await hashPassword(payload.password);
    const user = await userRepository.createUser({
      name: payload.owner_name,
      email: payload.email,
      phone: payload.mobile,
      password: hashed,
      role_id: role.role_id,
      status: USER_STATUS.PENDING,
      preferred_language: payload.preferred_language || 'en',
    });

    const vendor = await vendorRepository.createVendor({
      user_id: user.user_id,
      business_name: payload.business_name,
      owner_name: payload.owner_name,
      mobile: payload.mobile,
      email: payload.email,
      address: payload.address,
      gstin: payload.gstin,
      business_documents: payload.business_documents,
      bank_details: payload.bank_details,
      preferred_language: payload.preferred_language || 'en',
      status: VENDOR_STATUS.PENDING,
    });

    return { user: sanitizeUser(user), vendor };
  } catch (error) {
    logger.error('registerVendor failed', { error: error.message });
    throw error;
  }
};

export const getVendorByUserId = async (userId) => {
  const vendor = await vendorRepository.getByUserId(userId);
  if (!vendor) {
    throw new AppError(VENDOR_MESSAGES.VENDOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return vendor;
};

export const updateMyVendor = async (userId, payload) => {
  const vendor = await getVendorByUserId(userId);
  const updates = {};
  [
    'business_name',
    'owner_name',
    'mobile',
    'address',
    'gstin',
    'business_documents',
    'bank_details',
    'preferred_language',
  ].forEach((key) => {
    if (payload[key] !== undefined) updates[key] = payload[key];
  });
  return vendorRepository.updateVendor(vendor.vendor_id, updates);
};

export const listVendorsAdmin = async (query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const result = await vendorRepository.listVendors({ ...query, limit, skip });
  return {
    vendors: result.items,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: result.items.length,
      total: result.total,
    }),
  };
};

export const getVendorAdmin = async (vendorId) => {
  const vendor = await vendorRepository.getById(vendorId);
  if (!vendor) {
    throw new AppError(VENDOR_MESSAGES.VENDOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return vendor;
};

export const approveVendor = async (vendorId, adminUserId) => {
  const vendor = await getVendorAdmin(vendorId);
  const updated = await vendorRepository.updateVendor(vendorId, {
    status: VENDOR_STATUS.APPROVED,
    approved_at: new Date().toISOString(),
    approved_by: adminUserId,
    rejection_reason: null,
    suspended_reason: null,
  });
  await userRepository.updateUser(vendor.user_id, { status: USER_STATUS.APPROVED });
  return updated;
};

export const rejectVendor = async (vendorId, reason = '') => {
  await getVendorAdmin(vendorId);
  // Keep credentials usable so the portal can show rejection reason; APIs stay gated.
  return vendorRepository.updateVendor(vendorId, {
    status: VENDOR_STATUS.REJECTED,
    rejection_reason: reason || 'Rejected by admin',
  });
};

export const suspendVendor = async (vendorId, reason = '') => {
  await getVendorAdmin(vendorId);
  // Keep user loginable so the portal can show the suspended status gate;
  // business APIs remain blocked by requireApprovedVendor.
  return vendorRepository.updateVendor(vendorId, {
    status: VENDOR_STATUS.SUSPENDED,
    suspended_reason: reason || 'Suspended by admin',
  });
};

export const getDashboard = async (vendor) => {
  const products = await productRepository.listProducts({
    vendor_id: vendor.vendor_id,
    limit: 500,
    skip: 0,
  });
  const productItems = products.items || [];
  const totalProducts = productItems.length;
  const activeProducts = productItems.filter((p) => p.status === PRODUCT_STATUS.ACTIVE).length;
  const pendingApproval = productItems.filter((p) => p.status === PRODUCT_STATUS.PENDING_APPROVAL).length;

  const orders = await Order.find({ 'items.vendor_id': vendor.vendor_id }).lean();
  let pendingOrders = 0;
  let completedOrders = 0;
  let salesTotal = 0;

  for (const order of orders) {
    const mine = (order.items || []).filter((item) => item.vendor_id === vendor.vendor_id);
    if (!mine.length) continue;
    const hasPending = mine.some((item) =>
      [VENDOR_ORDER_ITEM_STATUS.PENDING, VENDOR_ORDER_ITEM_STATUS.ACCEPTED, VENDOR_ORDER_ITEM_STATUS.PREPARING].includes(
        item.vendor_status,
      ),
    );
    const allDone = mine.every((item) =>
      [VENDOR_ORDER_ITEM_STATUS.DISPATCHED, VENDOR_ORDER_ITEM_STATUS.REJECTED].includes(item.vendor_status),
    );
    if (hasPending) pendingOrders += 1;
    if (allDone && mine.some((item) => item.vendor_status === VENDOR_ORDER_ITEM_STATUS.DISPATCHED)) {
      completedOrders += 1;
    }
    salesTotal += mine
      .filter((item) => item.vendor_status !== VENDOR_ORDER_ITEM_STATUS.REJECTED)
      .reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  }

  const inventory = await inventoryRepository.listInventory({ limit: 500, skip: 0 });
  const productIds = new Set(productItems.map((p) => p.product_id));
  const myInventory = (inventory.items || []).filter((row) => productIds.has(row.product_id));
  const lowStock = myInventory.filter((row) => row.available_stock <= row.low_stock_threshold).length;
  const totalStockUnits = myInventory.reduce((sum, row) => sum + (Number(row.available_stock) || 0), 0);

  return {
    total_products: totalProducts,
    active_products: activeProducts,
    pending_approval: pendingApproval,
    total_orders: orders.length,
    pending_orders: pendingOrders,
    completed_orders: completedOrders,
    sales_summary: {
      gross_sales: Math.round(salesTotal * 100) / 100,
      commission_rate: vendor.commission_rate ?? DEFAULT_COMMISSION_RATE,
      estimated_commission:
        Math.round(salesTotal * (vendor.commission_rate ?? DEFAULT_COMMISSION_RATE) * 100) / 100,
    },
    inventory_summary: {
      variants_tracked: myInventory.length,
      low_stock_count: lowStock,
      total_available_units: totalStockUnits,
    },
    vendor_status: vendor.status,
  };
};

export const listVendorProducts = async (vendor, query = {}) => {
  const language = normalizeLanguage(query.lang || query.language);
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const result = await productRepository.listProducts({
    ...query,
    vendor_id: vendor.vendor_id,
    limit,
    skip,
  });

  const products = await Promise.all(
    result.items.map(async (product) => {
      const withVariants = await productVariantRepository.listByProductId(product.product_id, {
        limit: 100,
      });
      return {
        ...withLocalizedFields(product, ['name', 'description'], language),
        variants: withVariants.items,
      };
    }),
  );

  return {
    products,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: products.length,
      total: result.total,
    }),
  };
};

export const createVendorProduct = async (vendor, payload, userId) => {
  return productService.createProduct(
    {
      ...payload,
      vendor_id: vendor.vendor_id,
      status: payload.status || PRODUCT_STATUS.DRAFT,
      is_featured: false,
      is_best_seller: false,
    },
    userId,
  );
};

export const updateVendorProduct = async (vendor, productId, payload, userId) => {
  await assertOwnsProduct(vendor.vendor_id, productId);
  const { vendor_id: _ignore, is_featured, is_best_seller, status, ...safe } = payload;
  // Vendors cannot self-publish as active; use submit endpoint.
  if (status && ![PRODUCT_STATUS.DRAFT, PRODUCT_STATUS.INACTIVE].includes(status)) {
    throw new AppError(
      'Vendors may only set draft or inactive status directly',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.BUSINESS_VALIDATION_ERROR,
    );
  }
  return productService.updateProduct(productId, { ...safe, status }, userId);
};

export const submitProductForApproval = async (vendor, productId, userId) => {
  await assertOwnsProduct(vendor.vendor_id, productId);
  return productService.updateProduct(
    productId,
    { status: PRODUCT_STATUS.PENDING_APPROVAL },
    userId,
  );
};

export const deleteVendorProduct = async (vendor, productId, userId) => {
  await assertOwnsProduct(vendor.vendor_id, productId);
  return productService.deleteProduct(productId, userId);
};

export const upsertVendorVariant = async (vendor, productId, payload, userId) => {
  await assertOwnsProduct(vendor.vendor_id, productId);
  return productService.createProductVariant(productId, payload, userId);
};

export const updateVendorVariant = async (vendor, productId, variantId, payload, userId) => {
  await assertOwnsProduct(vendor.vendor_id, productId);
  return productService.updateProductVariant(productId, variantId, payload, userId);
};

export const listVendorInventory = async (vendor, query = {}) => {
  const products = await productRepository.listProducts({
    vendor_id: vendor.vendor_id,
    limit: 500,
    skip: 0,
  });
  const productIds = new Set(products.items.map((p) => p.product_id));
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const result = await inventoryRepository.listInventory({ ...query, limit: 500, skip: 0 });
  const filtered = (result.items || []).filter((row) => productIds.has(row.product_id));
  const pageItems = filtered.slice(skip, skip + limit);

  const inventory = await Promise.all(
    pageItems.map(async (row) => {
      const variant = await productVariantRepository.getVariantById(row.variant_id);
      return { ...row, variant };
    }),
  );

  return {
    inventory,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: inventory.length,
      total: filtered.length,
    }),
  };
};

export const listVendorLowStock = async (vendor, query = {}) => {
  const result = await listVendorInventory(vendor, { ...query, limit: 500 });
  const low = result.inventory.filter((row) => row.available_stock <= row.low_stock_threshold);
  return { inventory: low, count: low.length };
};

export const updateVendorInventory = async (vendor, variantId, payload, userId) => {
  const variant = await productVariantRepository.getVariantById(variantId);
  if (!variant) {
    throw new AppError('Product variant not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  await assertOwnsProduct(vendor.vendor_id, variant.product_id);
  return inventoryService.updateInventory(variantId, payload, userId);
};

export const getVendorInventoryDetail = async (vendor, variantId, query = {}) => {
  const variant = await productVariantRepository.getVariantById(variantId);
  if (!variant) {
    throw new AppError('Product variant not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  await assertOwnsProduct(vendor.vendor_id, variant.product_id);
  return inventoryService.getInventoryByVariantId(variantId, query);
};

const filterOrderForVendor = (order, vendorId) => {
  const items = (order.items || []).filter((item) => item.vendor_id === vendorId);
  if (!items.length) return null;
  const vendorSubtotal = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  return {
    ...order,
    items,
    vendor_subtotal: Math.round(vendorSubtotal * 100) / 100,
  };
};

export const listVendorOrders = async (vendor, query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const docs = await Order.find({ 'items.vendor_id': vendor.vendor_id })
    .sort({ created_at: -1 })
    .lean();

  let orders = docs.map((order) => filterOrderForVendor(order, vendor.vendor_id)).filter(Boolean);
  if (query.status) {
    orders = orders.filter((order) =>
      order.items.some((item) => item.vendor_status === query.status),
    );
  }

  const total = orders.length;
  const pageItems = orders.slice(skip, skip + limit);
  return {
    orders: pageItems,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: pageItems.length,
      total,
    }),
  };
};

export const getVendorOrder = async (vendor, orderId) => {
  const order = await orderRepository.getById(orderId);
  if (!order) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  const scoped = filterOrderForVendor(order, vendor.vendor_id);
  if (!scoped) {
    throw new AppError(VENDOR_MESSAGES.ACCESS_DENIED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
  return scoped;
};

const ALLOWED_TRANSITIONS = {
  [VENDOR_ORDER_ITEM_STATUS.PENDING]: [
    VENDOR_ORDER_ITEM_STATUS.ACCEPTED,
    VENDOR_ORDER_ITEM_STATUS.REJECTED,
  ],
  [VENDOR_ORDER_ITEM_STATUS.ACCEPTED]: [
    VENDOR_ORDER_ITEM_STATUS.PREPARING,
    VENDOR_ORDER_ITEM_STATUS.REJECTED,
  ],
  [VENDOR_ORDER_ITEM_STATUS.PREPARING]: [VENDOR_ORDER_ITEM_STATUS.READY],
  [VENDOR_ORDER_ITEM_STATUS.READY]: [VENDOR_ORDER_ITEM_STATUS.DISPATCHED],
};

export const updateVendorOrderItemStatus = async (
  vendor,
  orderId,
  { order_item_id, status, reason },
) => {
  const order = await orderRepository.getById(orderId);
  if (!order) {
    throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const items = [...(order.items || [])];
  const index = items.findIndex(
    (item) => item.order_item_id === order_item_id && item.vendor_id === vendor.vendor_id,
  );
  if (index < 0) {
    throw new AppError(VENDOR_MESSAGES.ACCESS_DENIED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  const current = items[index].vendor_status || VENDOR_ORDER_ITEM_STATUS.PENDING;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  if (!allowed.includes(status)) {
    throw new AppError(
      VENDOR_MESSAGES.INVALID_STATUS_TRANSITION,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.BUSINESS_VALIDATION_ERROR,
    );
  }

  items[index] = {
    ...items[index],
    vendor_status: status,
    vendor_status_reason: reason || null,
  };

  await orderRepository.updateOrder(orderId, { items });
  return getVendorOrder(vendor, orderId);
};

export const getVendorReports = async (vendor) => {
  const orders = await Order.find({ 'items.vendor_id': vendor.vendor_id }).lean();
  const productSales = new Map();
  let gross = 0;
  let acceptedLines = 0;
  let rejectedLines = 0;
  let dispatchedLines = 0;

  for (const order of orders) {
    for (const item of order.items || []) {
      if (item.vendor_id !== vendor.vendor_id) continue;
      if (item.vendor_status === VENDOR_ORDER_ITEM_STATUS.REJECTED) {
        rejectedLines += 1;
        continue;
      }
      acceptedLines += 1;
      if (item.vendor_status === VENDOR_ORDER_ITEM_STATUS.DISPATCHED) dispatchedLines += 1;
      gross += Number(item.line_total || 0);
      const key = item.product_id;
      const prev = productSales.get(key) || {
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: 0,
        revenue: 0,
      };
      prev.quantity += Number(item.quantity || 0);
      prev.revenue += Number(item.line_total || 0);
      productSales.set(key, prev);
    }
  }

  const commissionRate = vendor.commission_rate ?? DEFAULT_COMMISSION_RATE;
  const commission = Math.round(gross * commissionRate * 100) / 100;
  const netSettlement = Math.round((gross - commission) * 100) / 100;

  return {
    sales: {
      gross_sales: Math.round(gross * 100) / 100,
      order_count: orders.length,
      accepted_lines: acceptedLines,
      rejected_lines: rejectedLines,
      dispatched_lines: dispatchedLines,
    },
    product_performance: [...productSales.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20),
    commission: {
      rate: commissionRate,
      amount: commission,
    },
    settlements: {
      status: 'pending_payout',
      gross_sales: Math.round(gross * 100) / 100,
      commission,
      net_payable: netSettlement,
      note: 'Settlement payouts are calculated here; payment transfer is handled in a later ops phase.',
    },
  };
};

export default {
  registerVendor,
  getVendorByUserId,
  updateMyVendor,
  listVendorsAdmin,
  getVendorAdmin,
  approveVendor,
  rejectVendor,
  suspendVendor,
  getDashboard,
  listVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  submitProductForApproval,
  deleteVendorProduct,
  upsertVendorVariant,
  updateVendorVariant,
  listVendorInventory,
  listVendorLowStock,
  updateVendorInventory,
  getVendorInventoryDetail,
  listVendorOrders,
  getVendorOrder,
  updateVendorOrderItemStatus,
  getVendorReports,
};
