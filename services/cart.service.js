import cartRepository from '../repositories/cart.repository.js';
import productVariantRepository from '../repositories/productVariant.repository.js';
import productRepository from '../repositories/product.repository.js';
import inventoryRepository from '../repositories/inventory.repository.js';
import couponService from './coupon.service.js';
import { CART_MESSAGES } from '../constants/cart.constants.js';
import { VARIANT_STATUS } from '../constants/product.constants.js';
import { calculateCheckoutTotals } from '../utils/pricing.util.js';
import { DELIVERY_OPTIONS } from '../constants/order.constants.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

const localizeName = (product, lang = 'en') => {
  if (!product) return '';
  if (lang === 'kn' && product.name_kn) return product.name_kn;
  if (lang === 'hi' && product.name_hi) return product.name_hi;
  return product.name_en || '';
};

const getAvailableStock = async (variantId) => {
  const inventory = await inventoryRepository.getByVariantId(variantId);
  if (inventory) return Number(inventory.available_stock) || 0;
  const variant = await productVariantRepository.getVariantById(variantId);
  return Number(variant?.stock_quantity) || 0;
};

const assertVariantPurchasable = async (variantId, quantity) => {
  const variant = await productVariantRepository.getVariantById(variantId);
  if (!variant || variant.status === VARIANT_STATUS.INACTIVE) {
    throw new AppError(CART_MESSAGES.VARIANT_UNAVAILABLE, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    throw new AppError(CART_MESSAGES.INVALID_QUANTITY, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  if (qty < (variant.minimum_order_quantity || 1)) {
    throw new AppError(
      `Minimum order quantity is ${variant.minimum_order_quantity}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.BUSINESS_VALIDATION_ERROR,
    );
  }

  const available = await getAvailableStock(variantId);
  if (qty > available || variant.status === VARIANT_STATUS.OUT_OF_STOCK) {
    throw new AppError(CART_MESSAGES.INSUFFICIENT_STOCK, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  const product = await productRepository.getProductById(variant.product_id);
  if (!product || product.status !== 'active') {
    throw new AppError(CART_MESSAGES.VARIANT_UNAVAILABLE, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BUSINESS_VALIDATION_ERROR);
  }

  return { variant, product, available };
};

export const ensureCart = async (userId) => {
  let cart = await cartRepository.getByUserId(userId);
  if (!cart) cart = await cartRepository.createCart(userId);
  return cart;
};

export const hydrateCart = async (userId, { language = 'en', delivery_option = DELIVERY_OPTIONS.STANDARD } = {}) => {
  const cart = await ensureCart(userId);
  const lineItems = [];

  for (const item of cart.items || []) {
    try {
      const { variant, product, available } = await assertVariantPurchasable(item.variant_id, item.quantity);
      const unitPrice = Number(variant.selling_price) || 0;
      lineItems.push({
        variant_id: variant.variant_id,
        product_id: product.product_id,
        product_slug: product.product_slug,
        name: localizeName(product, language),
        name_en: product.name_en,
        name_kn: product.name_kn,
        name_hi: product.name_hi,
        image: product.product_images?.[0] || null,
        sku: variant.sku,
        unit_label: `${variant.weight} ${variant.unit}`,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: Math.round(unitPrice * item.quantity * 100) / 100,
        available_stock: available,
        minimum_order_quantity: variant.minimum_order_quantity,
      });
    } catch {
      // Skip unavailable lines in display; checkout will re-validate strictly.
      lineItems.push({
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unavailable: true,
        unit_price: 0,
        line_total: 0,
      });
    }
  }

  let coupon = null;
  let coupon_error = null;
  if (cart.coupon_code) {
    try {
      const provisionalSubtotal = lineItems
        .filter((line) => !line.unavailable)
        .reduce((sum, line) => sum + line.line_total, 0);
      coupon = await couponService.validateCouponForUser(cart.coupon_code, userId, provisionalSubtotal);
    } catch (error) {
      coupon_error = error.message;
    }
  }

  const validLines = lineItems.filter((line) => !line.unavailable);
  const totals = calculateCheckoutTotals({
    lineItems: validLines,
    coupon,
    deliveryOption: delivery_option,
  });

  return {
    cart_id: cart.cart_id,
    user_id: cart.user_id,
    coupon_code: coupon ? coupon.code : cart.coupon_code,
    coupon_error,
    items: lineItems,
    item_count: validLines.reduce((sum, line) => sum + line.quantity, 0),
    ...totals,
    delivery_option,
  };
};

export const addItem = async (userId, { variant_id, quantity = 1 }, language = 'en') => {
  try {
    const qty = Number(quantity) || 1;
    const { variant, product } = await assertVariantPurchasable(variant_id, qty);
    const cart = await ensureCart(userId);
    const items = [...(cart.items || [])];
    const existing = items.find((item) => item.variant_id === variant_id);
    const nextQty = existing ? existing.quantity + qty : qty;
    await assertVariantPurchasable(variant_id, nextQty);

    if (existing) {
      existing.quantity = nextQty;
    } else {
      items.push({
        variant_id: variant.variant_id,
        product_id: product.product_id,
        quantity: qty,
        added_at: new Date().toISOString(),
      });
    }

    await cartRepository.saveCart(userId, { items });
    return hydrateCart(userId, { language });
  } catch (error) {
    logger.error('addItem failed', { error: error.message, userId, variant_id });
    throw error;
  }
};

export const updateItem = async (userId, variantId, quantity, language = 'en') => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    throw new AppError(CART_MESSAGES.INVALID_QUANTITY, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  await assertVariantPurchasable(variantId, qty);
  const cart = await ensureCart(userId);
  const items = [...(cart.items || [])];
  const index = items.findIndex((item) => item.variant_id === variantId);
  if (index < 0) {
    throw new AppError(CART_MESSAGES.VARIANT_REQUIRED, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  items[index] = { ...items[index], quantity: qty };
  await cartRepository.saveCart(userId, { items });
  return hydrateCart(userId, { language });
};

export const removeItem = async (userId, variantId, language = 'en') => {
  const cart = await ensureCart(userId);
  const items = (cart.items || []).filter((item) => item.variant_id !== variantId);
  await cartRepository.saveCart(userId, { items });
  return hydrateCart(userId, { language });
};

export const clearCart = async (userId, language = 'en') => {
  await cartRepository.clearCart(userId);
  return hydrateCart(userId, { language });
};

export const applyCoupon = async (userId, code, language = 'en') => {
  const cart = await hydrateCart(userId, { language });
  await couponService.validateCouponForUser(code, userId, cart.subtotal);
  await cartRepository.saveCart(userId, {
    items: (await ensureCart(userId)).items,
    coupon_code: String(code).trim().toUpperCase(),
  });
  return hydrateCart(userId, { language });
};

export const removeCoupon = async (userId, language = 'en') => {
  const cart = await ensureCart(userId);
  await cartRepository.saveCart(userId, { items: cart.items, coupon_code: null });
  return hydrateCart(userId, { language });
};

export const mergeGuestItems = async (userId, guestItems = [], language = 'en') => {
  for (const item of guestItems) {
    if (!item?.variant_id) continue;
    try {
      await addItem(userId, { variant_id: item.variant_id, quantity: item.quantity || 1 }, language);
    } catch (error) {
      logger.warn('mergeGuestItems skipped item', { variant_id: item.variant_id, error: error.message });
    }
  }
  return hydrateCart(userId, { language });
};

export default {
  ensureCart,
  hydrateCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeGuestItems,
};
