import mongoose from 'mongoose';
import cartRepository from '../repositories/cart.repository.js';
import cartService from './cart.service.js';
import couponService from './coupon.service.js';
import addressRepository from '../repositories/address.repository.js';
import orderRepository from '../repositories/order.repository.js';
import couponRepository from '../repositories/coupon.repository.js';
import inventoryRepository from '../repositories/inventory.repository.js';
import productVariantRepository from '../repositories/productVariant.repository.js';
import productRepository from '../repositories/product.repository.js';
import userRepository from '../repositories/user.repository.js';
import Inventory from '../models/inventory.model.js';
import { snapshotAddress } from '../models/address.model.js';
import { generateId } from '../utils/uuid.util.js';
import { buildOrderNumber } from '../utils/orderNumber.util.js';
import { calculateCheckoutTotals } from '../utils/pricing.util.js';
import {
  CANCELABLE_STATUSES,
  DELIVERY_OPTIONS,
  ORDER_MESSAGES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from '../constants/order.constants.js';
import { VENDOR_ORDER_ITEM_STATUS } from '../constants/vendor.constants.js';
import { STOCK_MOVEMENT_TYPES } from '../constants/inventory.constants.js';
import { VARIANT_STATUS } from '../constants/product.constants.js';
import paymentService from './payment.service.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import { parsePaginationQuery, buildPaginationMeta } from '../utils/pagination.util.js';
import logger from '../config/logger.js';

const localizeName = (product, lang = 'en') => {
  if (!product) return '';
  if (lang === 'kn' && product.name_kn) return product.name_kn;
  if (lang === 'hi' && product.name_hi) return product.name_hi;
  return product.name_en || '';
};

const reserveStockAtomic = async (variantId, quantity, session) => {
  const inventory = await Inventory.findOneAndUpdate(
    { variant_id: variantId, available_stock: { $gte: quantity } },
    {
      $inc: { available_stock: -quantity, reserved_stock: quantity },
      $set: { updated_at: new Date().toISOString() },
    },
    { new: true, session },
  );

  if (!inventory) {
    // Fallback: if inventory row missing, try creating from variant then retry once.
    const variant = await productVariantRepository.getVariantById(variantId);
    if (!variant || (Number(variant.stock_quantity) || 0) < quantity) {
      throw new AppError(ORDER_MESSAGES.INSUFFICIENT_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }
    throw new AppError(ORDER_MESSAGES.INSUFFICIENT_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  await productVariantRepository.syncStockQuantity(variantId, inventory.available_stock);
  return inventory;
};

const releaseStockAtomic = async (variantId, quantity, session) => {
  const inventory = await Inventory.findOneAndUpdate(
    { variant_id: variantId, reserved_stock: { $gte: quantity } },
    {
      $inc: { available_stock: quantity, reserved_stock: -quantity },
      $set: { updated_at: new Date().toISOString() },
    },
    { new: true, session },
  );
  if (inventory) {
    await productVariantRepository.syncStockQuantity(variantId, inventory.available_stock);
  }
  return inventory;
};

const buildPricedLines = async (cartItems, language) => {
  const lines = [];
  for (const item of cartItems || []) {
    const variant = await productVariantRepository.getVariantById(item.variant_id);
    if (!variant || variant.status === VARIANT_STATUS.INACTIVE) {
      throw new AppError(ORDER_MESSAGES.INSUFFICIENT_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }
    const product = await productRepository.getProductById(variant.product_id);
    if (!product || product.status !== 'active') {
      throw new AppError(ORDER_MESSAGES.INSUFFICIENT_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }
    const inventory = await inventoryRepository.getByVariantId(variant.variant_id);
    const available = inventory
      ? Number(inventory.available_stock) || 0
      : Number(variant.stock_quantity) || 0;
    if (item.quantity > available) {
      throw new AppError(ORDER_MESSAGES.INSUFFICIENT_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
    }

    const unitPrice = Number(variant.selling_price) || 0;
    lines.push({
      order_item_id: generateId(),
      product_id: product.product_id,
      variant_id: variant.variant_id,
      product_name: localizeName(product, language),
      product_name_en: product.name_en || '',
      product_name_kn: product.name_kn || '',
      product_name_hi: product.name_hi || '',
      sku: variant.sku,
      unit_label: `${variant.weight} ${variant.unit}`,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: Math.round(unitPrice * item.quantity * 100) / 100,
      vendor_id: product.vendor_id || null,
      vendor_status: product.vendor_id
        ? VENDOR_ORDER_ITEM_STATUS.PENDING
        : VENDOR_ORDER_ITEM_STATUS.ACCEPTED,
    });
  }
  return lines;
};

export const getCheckoutQuote = async (
  userId,
  { address_id, delivery_option = DELIVERY_OPTIONS.STANDARD, language = 'en' } = {},
) => {
  const cart = await cartRepository.getByUserId(userId);
  if (!cart?.items?.length) {
    throw new AppError(ORDER_MESSAGES.CART_EMPTY, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const lines = await buildPricedLines(cart.items, language);
  let coupon = null;
  if (cart.coupon_code) {
    const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
    coupon = await couponService.validateCouponForUser(cart.coupon_code, userId, subtotal);
  }

  const totals = calculateCheckoutTotals({
    lineItems: lines,
    coupon,
    deliveryOption: delivery_option,
  });

  let address = null;
  if (address_id) {
    address = await addressRepository.getById(address_id);
    if (!address || address.user_id !== userId) {
      throw new AppError(ORDER_MESSAGES.INVALID_ADDRESS, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }
  }

  const user = await userRepository.getUserById(userId);

  const paymentConfig = paymentService.getPaymentConfig();

  return {
    customer: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferred_language: user.preferred_language || language,
    },
    address: address ? snapshotAddress(address) : null,
    delivery_option,
    payment_methods: paymentConfig.payment_methods,
    payment_config: {
      cod_enabled: paymentConfig.cod_enabled,
      online_enabled: paymentConfig.online_enabled,
      currency: paymentConfig.currency,
    },
    items: lines,
    coupon_code: coupon?.code || null,
    ...totals,
  };
};

export const createOrder = async (userId, payload = {}) => {
  const {
    address_id,
    delivery_option = DELIVERY_OPTIONS.STANDARD,
    payment_method = PAYMENT_METHODS.COD,
    language,
    idempotency_key,
  } = payload;

  if (idempotency_key) {
    const existing = await orderRepository.getByIdempotencyKey(userId, idempotency_key);
    if (existing) return existing;
  }

  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const customerLanguage = language || user.preferred_language || 'en';
  const cart = await cartRepository.getByUserId(userId);
  if (!cart?.items?.length) {
    throw new AppError(ORDER_MESSAGES.CART_EMPTY, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const address = await addressRepository.getById(address_id);
  if (!address || address.user_id !== userId) {
    throw new AppError(ORDER_MESSAGES.INVALID_ADDRESS, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (!Object.values(PAYMENT_METHODS).includes(payment_method)) {
    throw new AppError('Invalid payment method', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  paymentService.assertPaymentMethodAllowed(payment_method);

  const lines = await buildPricedLines(cart.items, customerLanguage);
  let coupon = null;
  if (cart.coupon_code) {
    const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
    coupon = await couponService.validateCouponForUser(cart.coupon_code, userId, subtotal);
  }

  const totals = calculateCheckoutTotals({
    lineItems: lines,
    coupon,
    deliveryOption: delivery_option,
  });

  const sequence = (await orderRepository.countTodayOrders()) + 1;
  const orderNumber = buildOrderNumber(sequence);

  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      if (idempotency_key) {
        const duplicate = await orderRepository.getByIdempotencyKey(userId, idempotency_key);
        if (duplicate) {
          createdOrder = duplicate;
          return;
        }
      }

      const reserved = [];
      for (const line of lines) {
        const inventory = await reserveStockAtomic(line.variant_id, line.quantity, session);
        reserved.push({ line, inventory });
      }

      createdOrder = await orderRepository.createOrder(
        {
          order_number: orderNumber,
          customer_id: userId,
          customer_name: user.name,
          customer_email: user.email,
          customer_phone: user.phone,
          customer_language: customerLanguage,
          items: lines,
          address_snapshot: snapshotAddress(address),
          delivery_option,
          payment_method,
          payment_status: PAYMENT_STATUS.PENDING,
          order_status: ORDER_STATUS.PLACED,
          coupon_code: coupon?.code || null,
          ...totals,
          idempotency_key: idempotency_key || null,
        },
        session,
      );

      if (coupon) {
        await couponRepository.incrementUsage(coupon.coupon_id, session);
      }

      // Attach for post-commit movement logging
      createdOrder._reserved = reserved;
    });
  } catch (error) {
    logger.error('createOrder failed', { error: error.message, userId });
    if (error instanceof AppError) throw error;
    if (error?.code === 11000) {
      const existing = await orderRepository.getByIdempotencyKey(userId, idempotency_key);
      if (existing) return existing;
      throw new AppError(ORDER_MESSAGES.DUPLICATE_ORDER, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    }
    throw error;
  } finally {
    session.endSession();
  }

  try {
    for (const entry of createdOrder?._reserved || []) {
      const { line, inventory } = entry;
      await inventoryRepository.createStockMovement(
        {
          variant_id: line.variant_id,
          product_id: line.product_id,
          movement_type: STOCK_MOVEMENT_TYPES.RESERVE,
          quantity: -line.quantity,
          previous_available: inventory.available_stock + line.quantity,
          new_available: inventory.available_stock,
          previous_reserved: inventory.reserved_stock - line.quantity,
          new_reserved: inventory.reserved_stock,
          reason: `Order ${createdOrder.order_number}`,
          reference_id: createdOrder.order_id,
        },
        userId,
      );
    }
    await cartRepository.clearCart(userId);
  } catch (postError) {
    logger.warn('createOrder post-commit housekeeping failed', { error: postError.message });
  }

  const { _reserved, ...safeOrder } = createdOrder || {};

  // Online methods: create Razorpay payment order using server-side totals only.
  if (paymentService.isOnlineMethod(payment_method) && safeOrder?.order_id) {
    try {
      const payment = await paymentService.createPaymentOrder(userId, safeOrder.order_id, {
        payment_method,
        idempotency_key: idempotency_key ? `pay:${idempotency_key}` : undefined,
      });
      return { ...safeOrder, payment };
    } catch (paymentError) {
      logger.error('createOrder payment session failed', {
        error: paymentError.message,
        order_id: safeOrder.order_id,
      });
      return {
        ...safeOrder,
        payment: null,
        payment_error: paymentError.message,
      };
    }
  }

  return safeOrder;
};

export const listCustomerOrders = async (userId, query = {}) => {
  const { page, limit, skip } = parsePaginationQuery(query, 20);
  const result = await orderRepository.listByCustomer(userId, {
    limit,
    skip,
    status: query.status,
  });
  return {
    orders: result.items,
    pagination: buildPaginationMeta({
      page,
      limit,
      count: result.items.length,
      total: result.total,
    }),
  };
};

export const getCustomerOrder = async (userId, orderId) => {
  const order = await orderRepository.getById(orderId);
  if (!order || order.customer_id !== userId) {
    throw new AppError(ORDER_MESSAGES.ORDER_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  return order;
};

export const cancelCustomerOrder = async (userId, orderId, reason = '') => {
  const order = await getCustomerOrder(userId, orderId);
  if (!CANCELABLE_STATUSES.includes(order.order_status)) {
    throw new AppError(ORDER_MESSAGES.CANCEL_NOT_ALLOWED, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const session = await mongoose.startSession();
  try {
    const released = [];
    await session.withTransaction(async () => {
      for (const line of order.items || []) {
        const inventory = await releaseStockAtomic(line.variant_id, line.quantity, session);
        if (inventory) released.push({ line, inventory });
      }

      await orderRepository.updateOrder(
        order.order_id,
        {
          order_status: ORDER_STATUS.CANCELLED,
          cancellation_reason: reason || 'Cancelled by customer',
          cancelled_at: new Date().toISOString(),
          // Paid orders stay paid until a verified refund event updates status.
          payment_status: order.payment_status,
        },
        session,
      );
    });

    if (order.payment_status === PAYMENT_STATUS.PAID && paymentService.isOnlineMethod(order.payment_method)) {
      try {
        await paymentService.refundPayment(userId, {
          order_id: order.order_id,
          reason: reason || 'Order cancelled by customer',
        });
      } catch (refundError) {
        logger.warn('cancelCustomerOrder refund failed', {
          order_id: order.order_id,
          error: refundError.message,
        });
      }
    }

    for (const entry of released) {
      const { line, inventory } = entry;
      await inventoryRepository.createStockMovement(
        {
          variant_id: line.variant_id,
          product_id: line.product_id,
          movement_type: STOCK_MOVEMENT_TYPES.RELEASE,
          quantity: line.quantity,
          previous_available: inventory.available_stock - line.quantity,
          new_available: inventory.available_stock,
          previous_reserved: inventory.reserved_stock + line.quantity,
          new_reserved: inventory.reserved_stock,
          reason: `Cancel order ${order.order_number}`,
          reference_id: order.order_id,
        },
        userId,
      );
    }
  } finally {
    session.endSession();
  }

  return orderRepository.getById(orderId);
};

export default {
  getCheckoutQuote,
  createOrder,
  listCustomerOrders,
  getCustomerOrder,
  cancelCustomerOrder,
};
