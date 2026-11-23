import cartService from '../services/cart.service.js';
import { successResponse } from '../utils/response.util.js';
import { CART_MESSAGES } from '../constants/cart.constants.js';
import { COUPON_MESSAGES } from '../constants/coupon.constants.js';
import { HTTP_STATUS } from '../constants/error.constants.js';

const lang = (req) => req.query.lang || req.body?.language || 'en';

export const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.hydrateCart(req.user.user_id, { language: lang(req) });
    return successResponse(res, HTTP_STATUS.OK, CART_MESSAGES.CART_FETCHED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const cart = await cartService.addItem(req.user.user_id, req.body, lang(req));
    return successResponse(res, HTTP_STATUS.OK, CART_MESSAGES.ITEM_ADDED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateItem(
      req.user.user_id,
      req.params.variantId,
      req.body.quantity,
      lang(req),
    );
    return successResponse(res, HTTP_STATUS.OK, CART_MESSAGES.ITEM_UPDATED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(req.user.user_id, req.params.variantId, lang(req));
    return successResponse(res, HTTP_STATUS.OK, CART_MESSAGES.ITEM_REMOVED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const clear = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.user_id, lang(req));
    return successResponse(res, HTTP_STATUS.OK, CART_MESSAGES.CART_CLEARED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const cart = await cartService.applyCoupon(req.user.user_id, req.body.code, lang(req));
    return successResponse(res, HTTP_STATUS.OK, COUPON_MESSAGES.COUPON_APPLIED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const removeCoupon = async (req, res, next) => {
  try {
    const cart = await cartService.removeCoupon(req.user.user_id, lang(req));
    return successResponse(res, HTTP_STATUS.OK, COUPON_MESSAGES.COUPON_REMOVED, { cart });
  } catch (error) {
    return next(error);
  }
};

export const merge = async (req, res, next) => {
  try {
    const cart = await cartService.mergeGuestItems(req.user.user_id, req.body.items || [], lang(req));
    return successResponse(res, HTTP_STATUS.OK, CART_MESSAGES.CART_FETCHED, { cart });
  } catch (error) {
    return next(error);
  }
};

export default { getCart, addItem, updateItem, removeItem, clear, applyCoupon, removeCoupon, merge };
